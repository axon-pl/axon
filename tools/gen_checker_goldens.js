// Generate checker diagnostic goldens from compiler/checker_fixtures/*.syn
// Oracle: bootstrap compiler

const fs = require('fs')
const path = require('path')
const { loadOracle } = require('./oracle')

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

  const compiler = loadOracle()
  const fixtures = fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.syn'))
    .sort()

  for (const file of fixtures) {
    const name = path.basename(file, '.syn')
    const src = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')
    const diags = compiler.check_source(src)
    const outPath = path.join(GOLDENS_DIR, `diagnostics_${name}.json`)
    fs.writeFileSync(outPath, JSON.stringify(serializeDiagnostics(diags), null, 2) + '\n')
    console.log(`wrote ${path.relative(process.cwd(), outPath)} (${diags.length} diagnostics)`)
  }
}

main()
