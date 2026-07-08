// Generate AST golden JSON from compiler/fixtures/*.syn
// Oracle: bootstrap compiler

const fs = require('fs')
const path = require('path')
const { loadOracle } = require('./oracle')

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

  const compiler = loadOracle()
  const fixtures = fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.syn'))
    .sort()

  for (const file of fixtures) {
    const name = path.basename(file, '.syn')
    const src = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')
    const ast = compiler.parse(compiler.tokenize(src))
    const outPath = path.join(GOLDENS_DIR, `ast_${name}.json`)
    fs.writeFileSync(outPath, JSON.stringify(serializeAst(ast), null, 2) + '\n')
    console.log(`wrote ${path.relative(process.cwd(), outPath)}`)
  }
}

main()
