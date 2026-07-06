const { Lexer } = require('../dist/lexer.js')
const { Parser } = require('../dist/parser.js')
const { Codegen } = require('../dist/codegen.js')
const { AXON_STDLIB } = require('../dist/stdlib.js')
const vm = require('vm')

const examples = {
  hello: `console.log("Hello, Axon!")
let greeting = fn(name: string) -> string = "Hello, " + name + "!"
console.log(greeting("World"))`,

  types: `type Score = int where value >= 0 and value <= 100
type NonEmpty = string where length > 0
fn grade(score: Score, name: NonEmpty) -> string {
  match score {
    | n when n >= 90 => "{name}: A"
    | n when n >= 80 => "{name}: B"
    | n when n >= 70 => "{name}: C"
    | _              => "{name}: F"
  }
}
console.log(grade(95, "Alice"))
console.log(grade(73, "Bob"))`,

  loops: `let mut total = 0
let mut count = 0
for i in 1..=10 {
  total = total + i
  count = count + 1
}
console.log("Sum 1..10 = " + total + " (count: " + count + ")")`,

  generics: `record Pair<A, B> {
  first:  A
  second: B
}
fn swap<A, B>(p: Pair<A, B>) -> Pair<B, A> {
  Pair(p.second, p.first)
}
let p = Pair(42, "hello")
let q = swap(p)
console.log(q.first)`,

  pipeline: `record User {
  name:   string
  score:  int
  badges: int
}
let users = [
  User("Alice",   94, 7),
  User("Bob",     61, 2),
  User("Charlie", 88, 5),
  User("Diana",   73, 4),
  User("Eve",     99, 12),
]
let ranked =
  users
    |> filter(u => {
      let qualified = u.score >= 70
      let active    = u.badges >= 3
      qualified && active
    })
    |> map(u => {
      let tier = if u.score >= 90 { "Gold" } else { "Silver" }
      let label = tier + " — " + u.name
      { name: u.name, tier: tier, label: label, score: u.score }
    })
    |> sort_by(.score)
console.log("=== Ranked Users ===")
for r in ranked {
  console.log(r.score + "  " + r.label)
}`,

  enums: `enum Priority = Low | Medium | High | Critical
enum TaskStatus = Backlog | InProgress | Done | Cancelled
record Task {
  id:       int
  title:    string
  status:   TaskStatus
  priority: Priority
}
fn badge(t: Task) -> string {
  let s = match t.status {
    | TaskStatus.Backlog    => "[ ]"
    | TaskStatus.InProgress => "[~]"
    | TaskStatus.Done       => "[v]"
    | TaskStatus.Cancelled  => "[x]"
  }
  let p = match t.priority {
    | Priority.Critical => "!!!"
    | Priority.High     => "!!"
    | Priority.Medium   => "!"
    | Priority.Low      => "."
  }
  p + " " + s + " " + t.title
}
let tasks = [
  Task(1, "Design API",  TaskStatus.Done,       Priority.High),
  Task(2, "Write tests", TaskStatus.InProgress, Priority.Critical),
]
for t in tasks {
  console.log(badge(t))
}`,

  numbers: `let population  = 8_000_000_000
let bandwidth   = 1_000_000
let red         = 0xFF0000
let READ        = 0b0001
let WRITE       = 0b0010
let FULL_PERMS  = 0b0111
let golden      = 1.618_033_988
console.log(population)
console.log(red.toString(16))
console.log(FULL_PERMS.toString(2))`,

  compound: `let mut score = 0
score += 10
score += 25
score -= 5
score *= 2
score /= 4
console.log(score)
let mut msg = "Hello"
msg += ", Axon!"
console.log(msg)
let mut cfg = null
cfg ??= "production"
console.log(cfg)`,

  stdlib: `let words = split("one,two,three", ",")
console.log(to_upper(trim("  axon  ")))
console.log(min([3,1,4,1,5]))
console.log(max([3,1,4,1,5]))
console.log(uniq([1,2,2,3,3]))
console.log(take([1,2,3,4,5], 3))
console.log(chunk([1,2,3,4,5,6], 2))
console.log(clamp(150, 0, 100))
console.log(abs(-42))
console.log(pow(2, 8))`,
}

let passed = 0, failed = 0
for (const [name, src] of Object.entries(examples)) {
  try {
    const { ast, errors } = new Parser(new Lexer(src).tokenize()).parse()
    if (errors.length) {
      console.log(`COMPILE ERROR  [${name}]: ${errors[0].message}`)
      failed++; continue
    }
    const js = new Codegen().generate(ast)
    const ctx = { console: { log: () => {}, error: () => {}, warn: () => {} }, setTimeout: () => {}, Promise }
    vm.createContext(ctx)
    vm.runInContext(AXON_STDLIB, ctx)
    vm.runInContext('{\n' + js + '\n}', ctx)
    console.log(`PASS           [${name}]`)
    passed++
  } catch (e) {
    console.log(`RUNTIME ERROR  [${name}]: ${e.message}`)
    failed++
  }
}

console.log(`\n${passed} passed, ${failed} failed`)
