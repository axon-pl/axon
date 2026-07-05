const { Lexer } = require('../dist/lexer.js')
const { Parser } = require('../dist/parser.js')
const { Codegen } = require('../dist/codegen.js')
const vm = require('vm')

const src = `record Pair<A, B> {
  first:  A
  second: B
}

fn swap<A, B>(p: Pair<A, B>) -> Pair<B, A> {
  Pair(p.second, p.first)
}

let p = Pair(42, "hello")
let q = swap(p)
console.log(q.first)
console.log(q.second)`

const { ast, errors } = new Parser(new Lexer(src).tokenize()).parse()
console.log('errors:', errors)
const js = new Codegen().generate(ast)

// Find relevant lines
js.split('\n').filter(l => l.includes('Pair') || l.includes('swap') || l.includes('let p') || l.includes('let q')).forEach(l => console.log(l))

// Actually run it
console.log('\n--- Runtime ---')
try {
  const ctx = { console }
  vm.createContext(ctx)
  vm.runInContext(js, ctx)
} catch (e) {
  console.error('Runtime error:', e.message)
}
