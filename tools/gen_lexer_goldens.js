// Generate lexer golden token JSON from compiler/fixtures/*.syn
// Oracle: bootstrap compiler

const fs = require('fs')
const path = require('path')
const { loadOracle } = require('./oracle')

const FIXTURES_DIR = path.join(__dirname, '..', 'compiler', 'fixtures')
const GOLDENS_DIR  = path.join(__dirname, '..', 'compiler', 'goldens')

function serializeTokens(tokens) {
  return tokens.map(t => ({
    type:  t.type,
    value: t.value,
    line:  t.line,
    col:   t.col,
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
    const src  = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')
    const tokens = compiler.tokenize(src)
    const golden = serializeTokens(tokens)
    const outPath = path.join(GOLDENS_DIR, `tokens_${name}.json`)
    fs.writeFileSync(outPath, JSON.stringify(golden, null, 2) + '\n')
    console.log(`wrote ${path.relative(process.cwd(), outPath)} (${golden.length} tokens)`)
  }
}

main()
