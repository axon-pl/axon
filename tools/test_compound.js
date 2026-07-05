const { Lexer } = require('../dist/lexer.js')
const { Parser } = require('../dist/parser.js')
const { Codegen } = require('../dist/codegen.js')
const vm = require('vm')

const src = `
let mut x = 10
x += 5
x -= 3
x *= 2
x /= 4
x %= 3
console.log(x)  // (((10+5)-3)*2)/4 = 6, then 6%3 = 0

let mut score = 100
score += 50
score -= 25
console.log(score)  // 125

let mut name = "Hello"
name += ", World"
console.log(name)

let mut val = null
val ??= "default"
console.log(val)

let mut arr = [1, 2, 3]
for n in arr {
  let mut doubled = n
  doubled *= 2
  console.log(doubled)
}
`

const { ast, errors } = new Parser(new Lexer(src).tokenize()).parse()
if (errors.length) { console.error('PARSE ERRORS:', errors); process.exit(1) }
const js = new Codegen().generate(ast)

// Show emitted compound assignment lines
js.split('\n').filter(l => /[+\-*\/]=/.test(l) || l.includes('??=')).forEach(l => console.log('emit:', l.trim()))

console.log('\n--- Runtime ---')
const ctx = { console }
vm.createContext(ctx)
vm.runInContext(js, ctx)
