// Generate codegen golden JS from compiler/fixtures/*.syn
// Oracle: bootstrap compiler

const fs = require('fs')
const path = require('path')
const { loadOracle } = require('./oracle')

const FIXTURES_DIR = path.join(__dirname, '..', 'compiler', 'fixtures')
const GOLDENS_DIR  = path.join(__dirname, '..', 'compiler', 'goldens')

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
    const js = compiler.compile(src).js
    const outPath = path.join(GOLDENS_DIR, `js_${name}.js`)
    fs.writeFileSync(outPath, js)
    console.log(`wrote ${path.relative(process.cwd(), outPath)} (${js.length} bytes)`)
  }
}

main()
