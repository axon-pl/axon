const fs = require('fs')
const vm = require('vm')

const bundleSrc = fs.readFileSync('demo/synth.compiler.js', 'utf8')
const ctx = { globalThis: {}, console }
ctx.window = ctx
vm.createContext(ctx)
vm.runInContext(bundleSrc, ctx)

const { SynthCompiler } = ctx

// Exact source from playground.html
const src = `// Fibonacci with @memo caching
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
}`

const { js, errors, warnings } = SynthCompiler.compile(src)
if (errors.length) {
  console.log('ERRORS:')
  errors.forEach(e => console.log(' ', e))
} else {
  console.log('OK — generated JS:')
  console.log(js)
}
if (warnings.length) {
  console.log('WARNINGS:', warnings)
}
