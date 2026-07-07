// Generate parser golden AST JSON from compiler/fixtures/*.syn
// Oracle: TypeScript Parser (dist/parser.js + dist/lexer.js)

const fs = require('fs')
const path = require('path')
const { Lexer } = require('../dist/lexer.js')
const { Parser } = require('../dist/parser.js')

const FIXTURES_DIR = path.join(__dirname, '..', 'compiler', 'fixtures')
const GOLDENS_DIR  = path.join(__dirname, '..', 'compiler', 'goldens')

function serializeAst(node) {
  if (node === null || node === undefined) return null
  if (typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(serializeAst)
  const out = {}
  for (const [key, value] of Object.entries(node)) {
    if (value === undefined) continue
    out[key] = serializeAst(value)
  }
  return out
}

function main() {
  if (!fs.existsSync(GOLDENS_DIR)) {
    fs.mkdirSync(GOLDENS_DIR, { recursive: true })
  }

  const fixtures = fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.syn'))
    .sort()

  if (fixtures.length === 0) {
    console.error('No .syn fixtures found in', FIXTURES_DIR)
    process.exit(1)
  }

  for (const file of fixtures) {
    const name = path.basename(file, '.syn')
    const src = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')
    const tokens = new Lexer(src).tokenize()
    const { ast, errors } = new Parser(tokens).parse()
    if (errors.length > 0) {
      console.error(`parse errors in fixture ${name}:`, errors.map(e => e.message).join('; '))
      process.exit(1)
    }
    const golden = serializeAst(ast)
    const outPath = path.join(GOLDENS_DIR, `ast_${name}.json`)
    fs.writeFileSync(outPath, JSON.stringify(golden, null, 2) + '\n')
    console.log(`wrote ${path.relative(process.cwd(), outPath)}`)
  }
}

main()
