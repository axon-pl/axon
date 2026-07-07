// Generate codegen golden JS from compiler/fixtures/*.syn
// Oracle: TypeScript Lexer + Parser + Codegen

const fs = require('fs')
const path = require('path')
const { Lexer } = require('../dist/lexer.js')
const { Parser } = require('../dist/parser.js')
const { Codegen } = require('../dist/codegen.js')

const FIXTURES_DIR = path.join(__dirname, '..', 'compiler', 'fixtures')
const GOLDENS_DIR  = path.join(__dirname, '..', 'compiler', 'goldens')

function main() {
  if (!fs.existsSync(GOLDENS_DIR)) {
    fs.mkdirSync(GOLDENS_DIR, { recursive: true })
  }

  const fixtures = fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.syn'))
    .sort()

  for (const file of fixtures) {
    const name = path.basename(file, '.syn')
    const src = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')
    const tokens = new Lexer(src).tokenize()
    const { ast, errors } = new Parser(tokens).parse()
    if (errors.length > 0) {
      console.error(`parse errors in fixture ${name}:`, errors.map(e => e.message).join('; '))
      process.exit(1)
    }
    const js = new Codegen().generate(ast)
    const outPath = path.join(GOLDENS_DIR, `js_${name}.js`)
    fs.writeFileSync(outPath, js)
    console.log(`wrote ${path.relative(process.cwd(), outPath)} (${js.length} bytes)`)
  }
}

main()
