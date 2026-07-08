// Shared bootstrap module golden comparison.
const fs   = require('fs')
const path = require('path')
const { ROOT, validateJs } = require('./bootstrap_common')

const COMPILER_DIR = path.join(ROOT, 'compiler')
const GOLDENS_DIR  = path.join(ROOT, 'compiler', 'goldens')

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

function testBootstrapModuleGoldens(compiler, { label = 'bootstrap module goldens' } = {}) {
  let failed = false
  console.log(`\n── ${label} ──`)

  for (const file of MODULES) {
    const name = path.basename(file, '.syn')
    const src = fs.readFileSync(path.join(COMPILER_DIR, file), 'utf8')
    const goldenPath = path.join(GOLDENS_DIR, `bootstrap_${name}.js`)

    if (!fs.existsSync(goldenPath)) {
      failed = true
      console.error(`FAIL ${file}: missing golden (run npm run gen:bootstrap-goldens)`)
      continue
    }

    try {
      const result = compiler.compile(src)
      const err = validateJs(result.js || '')
      if (err) {
        failed = true
        console.error(`FAIL ${file}: invalid JS — ${err}`)
        continue
      }
      const expected = fs.readFileSync(goldenPath, 'utf8')
      if (result.js !== expected) {
        failed = true
        console.error(`FAIL ${file}: output differs from bootstrap_${name}.js`)
        console.error(`  actual ${result.js.length}B vs golden ${expected.length}B`)
        let i = 0
        while (i < result.js.length && i < expected.length && result.js[i] === expected[i]) i++
        console.error(`  first diff at byte ${i}`)
      } else {
        console.log(`ok  ${file} (${result.js.length}B)`)
      }
    } catch (e) {
      failed = true
      console.error(`FAIL ${file}:`, e.message)
    }
  }

  return failed
}

module.exports = { MODULES, testBootstrapModuleGoldens }
