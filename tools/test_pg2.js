const { Lexer }   = require('../dist/lexer.js')
const { Parser }  = require('../dist/parser.js')
const { Codegen } = require('../dist/codegen.js')

function test(name, src) {
  try {
    const tokens = new Lexer(src).tokenize()
    const { ast, errors } = new Parser(tokens).parse()
    if (errors.length) {
      console.log(`FAIL  ${name}: ${errors.map(e=>e.message).join('; ')}`)
    } else {
      new Codegen().generate(ast)
      console.log(`ok    ${name}`)
    }
  } catch(e) { console.log(`FAIL  ${name}: ${e.message}`) }
}

test('fib', `// Fibonacci with @memo caching
fn fib :: (n: int) -> int {
  @pure @total @memo
  match n {
    | 0 => 0
    | 1 => 1
    | _ => fib(n - 1) + fib(n - 2)
  }
}

for i in 0..10 {
  console.log("fib(" + i + ") = " + fib(i))
}`)

test('pipeline', `// Pipeline operator |> with .field shorthands
record User {
  name:   string
  score:  int
  active: bool
}

let users = [
  User("Alice",   95, true),
  User("Bob",     62, false),
  User("Charlie", 88, true),
  User("Diana",   74, true),
  User("Eve",     91, false)
]

let result =
  users
    |> filter(.active)
    |> filter(u => u.score >= 75)
    |> map(.name)

for name in result {
  console.log("Top active user: " + name)
}

let total_score =
  users
    |> filter(.active)
    |> map(.score)
    |> sum

console.log("Active users total score: " + total_score)`)

test('loops', `// For loops + let mut (v0.5.2)
let mut total = 0
let mut count = 0

for i in 1..=10 {
  total = total + i
  count = count + 1
}

console.log("Sum 1..10 = " + total + " (count: " + count + ")")

// Nested loops — multiplication table
for row in 1..4 {
  let mut line = ""
  for col in 1..4 {
    let product = row * col
    let pad = product < 10 ? " " : ""
    line = line + pad + product + " "
  }
  console.log(line.trim())
}

// for...in over array
let words = ["synth", "is", "fun"]
let mut upper_words = []
for w in words {
  upper_words = upper_words.concat([w.toUpperCase()])
}
console.log(upper_words.join(" "))`)

test('multilambda', `// Multi-line lambdas (v0.9.5) — block bodies in arrow functions
record User {
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

// Multi-line lambda with local bindings
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
}`)

test('errors', `// Result type + ? propagation (v0.6)
@throws
fn parse_int(s: string) -> any {
  let n = parseInt(s, 10)
  if isNaN(n) { err("Not a number: " + s) }
  else { ok(n) }
}

@throws
fn parse_positive(s: string) -> any {
  let n = parse_int(s)?
  if n <= 0 { err("Must be positive, got: " + n) }
  else { ok(n) }
}

fn safe_parse(s: string) -> string {
  match parse_positive(s) {
    | Ok { value }   => "Parsed: " + value
    | Err { message } => "Error: " + message
  }
}

for s in ["42", "-5", "hello", "100"] {
  console.log(safe_parse(s))
}`)
