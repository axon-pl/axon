// Generate checker golden diagnostics from compiler/checker_fixtures/*.syn
// Oracle: TypeScript Lexer + Parser + Checker

const fs = require('fs')
const path = require('path')
const { Lexer } = require('../dist/lexer.js')
const { Parser } = require('../dist/parser.js')
const { Checker } = require('../dist/checker.js')

const FIXTURES_DIR = path.join(__dirname, '..', 'compiler', 'checker_fixtures')
const GOLDENS_DIR  = path.join(__dirname, '..', 'compiler', 'goldens')

function serializeDiagnostics(diags) {
  return diags.map(d => ({
    severity: d.severity,
    message:  d.message,
    line:     d.line,
  }))
}

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
      console.error(`parse errors in checker fixture ${name}:`, errors.map(e => e.message).join('; '))
      process.exit(1)
    }
    const golden = serializeDiagnostics(new Checker().check(ast))
    const outPath = path.join(GOLDENS_DIR, `diagnostics_${name}.json`)
    fs.writeFileSync(outPath, JSON.stringify(golden, null, 2) + '\n')
    console.log(`wrote ${path.relative(process.cwd(), outPath)} (${golden.length} diagnostics)`)
  }
}

main()
