// Generate bootstrap goldens: bootstrap oracle JS for each compiler/*.syn module.

const fs = require('fs')
const path = require('path')
const { loadOracle } = require('./oracle')

const COMPILER_DIR = path.join(__dirname, '..', 'compiler')
const GOLDENS_DIR  = path.join(__dirname, '..', 'compiler', 'goldens')

const MODULES = [
  'token.syn',
  'lexer.syn',
  'ast.syn',
  'parser.syn',
  'checker.syn',
  'codegen.syn',
  'formatter.syn',
  'driver.syn',
]

function main() {
  if (!fs.existsSync(GOLDENS_DIR)) {
    fs.mkdirSync(GOLDENS_DIR, { recursive: true })
  }

  const compiler = loadOracle()
  for (const file of MODULES) {
    const name = path.basename(file, '.syn')
    const src = fs.readFileSync(path.join(COMPILER_DIR, file), 'utf8')
    const js = compiler.compile(src).js
    const outPath = path.join(GOLDENS_DIR, `bootstrap_${name}.js`)
    fs.writeFileSync(outPath, js)
    console.log(`wrote ${path.relative(process.cwd(), outPath)} (${js.length} bytes)`)
  }
}

main()
