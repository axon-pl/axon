const { Lexer } = require('../dist/lexer.js')
const { Parser } = require('../dist/parser.js')
const { Codegen } = require('../dist/codegen.js')
const vm = require('vm')

const src = `// For loops + let mut (v0.5.2)
let mut total = 0
let mut count = 0

for i in 1..=10 {
  total = total + i
  count = count + 1
}

console.log("Sum 1..10 = " + total + " (count: " + count + ")")`

const { ast, errors } = new Parser(new Lexer(src).tokenize()).parse()
console.log('errors:', errors)
const js = new Codegen().generate(ast)

// show lines around count/total
js.split('\n').forEach((l, i) => {
  if (l.includes('count') || l.includes('total') || l.includes('for') || l.includes('let ')) {
    console.log(`${i+1}: ${l}`)
  }
})

console.log('\n--- Runtime ---')
try {
  const ctx = { console }
  vm.createContext(ctx)
  vm.runInContext(js, ctx)
} catch(e) {
  console.error('Runtime error:', e.message)
}
