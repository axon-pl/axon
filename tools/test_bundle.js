// Simulate how the browser uses synth.compiler.js
const fs = require('fs')
const vm = require('vm')

const bundleSrc = fs.readFileSync('demo/synth.compiler.js', 'utf8')
const ctx = { globalThis: {}, console }
ctx.window = ctx
vm.createContext(ctx)
vm.runInContext(bundleSrc, ctx)

const SynthCompiler = ctx.SynthCompiler
console.log('Bundle version:', SynthCompiler.version)

const examples = [
  ['loops', `let mut total = 0
let mut count = 0
for i in 1..=10 {
  total = total + i
  count = count + 1
}
console.log("Sum: " + total)`],

  ['pipeline_for', `record User { name: string\n  score: int\n  active: bool }
let users = [User("Alice", 95, true), User("Bob", 62, false)]
let result = users |> filter(.active) |> map(.name)
for name in result { console.log(name) }`],

  ['multilambda_if', `record User { name: string\n  score: int }
let users = [User("Alice", 94), User("Bob", 61)]
let ranked = users |> map(u => {
  let tier = if u.score >= 90 { "Gold" } else { "Silver" }
  tier + " - " + u.name
})
for r in ranked { console.log(r) }`],

  ['fib', `fn fib :: (n: int) -> int {
  @pure @total @memo
  match n {
    | 0 => 0
    | 1 => 1
    | _ => fib(n - 1) + fib(n - 2)
  }
}
for i in 0..10 { console.log("fib(" + i + ") = " + fib(i)) }`],
]

let pass = 0, fail = 0
for (const [name, src] of examples) {
  const { js, errors } = SynthCompiler.compile(src)
  if (errors.length) {
    console.log(`FAIL  ${name}: ${errors.map(e=>e.message).join('; ')}`)
    fail++
  } else {
    console.log(`ok    ${name}`)
    pass++
  }
}
console.log(`\n${pass} passed, ${fail} failed`)
