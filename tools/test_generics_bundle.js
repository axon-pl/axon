const fs = require('fs'), vm = require('vm')
const ctx = { globalThis: {}, console }
ctx.window = ctx
vm.createContext(ctx)
vm.runInContext(fs.readFileSync('demo/synth.compiler.js', 'utf8'), ctx)

const src = `record Pair<A, B> {
  first: A
  second: B
}
let p = Pair(42, "hello")
console.log(p)`

const r = ctx.SynthCompiler.compile(src)
console.log('errors:', r.errors)
const pairLine = r.js.split('\n').find(l => l.includes('const Pair'))
console.log('Pair constructor:', pairLine || 'NOT FOUND')

// Try running the output
try {
  const runCtx = { console }
  vm.createContext(runCtx)
  vm.runInContext(r.js, runCtx)
} catch(e) {
  console.error('Runtime error:', e.message)
}
