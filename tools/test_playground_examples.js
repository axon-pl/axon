const fs = require('fs')
const { Lexer }   = require('../dist/lexer.js')
const { Parser }  = require('../dist/parser.js')
const { Codegen } = require('../dist/codegen.js')

// Pull examples directly from playground.html by reading the file
const html = fs.readFileSync('demo/playground.html', 'utf8')

// Extract each backtick template between "key: `" and "}`,"
const exampleRegex = /^\s{2}(\w+): `([\s\S]*?)`(?:,\s*$|\n\n)/gm
let match
const examples = {}
// Instead use a simpler approach: grab the whole EXAMPLES block
const blockStart = html.indexOf('const EXAMPLES = {')
const blockEnd   = html.indexOf('\n}', blockStart)
const block = html.slice(blockStart + 'const EXAMPLES = {'.length, blockEnd)

// Split on "  key: `" delimiters
const parts = block.split(/\n  (\w+): `/)
// parts[0] = '', then alternating [key, value, key, value, ...]
for (let i = 1; i < parts.length; i += 2) {
  const key = parts[i]
  const val = parts[i + 1]
  if (!val) continue
  // trim trailing backtick+comma
  examples[key] = val.replace(/`\s*,?\s*$/, '').replace(/^`/, '')
}

let pass = 0, fail = 0
for (const [name, src] of Object.entries(examples)) {
  try {
    const tokens = new Lexer(src).tokenize()
    const { ast, errors } = new Parser(tokens).parse()
    if (errors.length) {
      console.log(`FAIL  ${name}:\n       ${errors.map(e => e.message).join('\n       ')}`)
      fail++
    } else {
      new Codegen().generate(ast)
      console.log(`ok    ${name}`)
      pass++
    }
  } catch (e) {
    console.log(`FAIL  ${name}: ${e.message}`)
    fail++
  }
}
console.log(`\n${pass} passed, ${fail} failed`)
