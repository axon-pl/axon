// Compiler parity harness — bootstrap oracle vs committed goldens.
// Run: npm run test:compiler

const fs = require('fs')
const path = require('path')
const { loadOracle, BOOTSTRAP, SEED } = require('./oracle')
const { runBundleParityTests, runAstConstructorTests } = require('./parity_common')

function testFormatter() {
  const compiler = loadOracle()
  if (typeof compiler.format !== 'function') {
    console.error('FAIL bootstrap: format export missing')
    return true
  }
  const src = 'export fn f() -> int { 1+2 }'
  const result = compiler.format(src)
  if (!result || typeof result.formatted !== 'string') {
    console.error('FAIL formatter: missing formatted string')
    return true
  }
  if (!result.changed) {
    console.error('FAIL formatter: expected changed=true for unformatted input')
    return true
  }
  if (!result.formatted.includes('1 + 2')) {
    console.error('FAIL formatter: expected spaced expression')
    return true
  }
  console.log('ok  formatter')
  return false
}

function main() {
  let failed = false
  try {
    const compiler = loadOracle()
    const bundlePath = fs.existsSync(BOOTSTRAP) ? BOOTSTRAP : SEED
    console.log('── bootstrap compiler parity ──')
    failed = runBundleParityTests(compiler, 'bootstrap') || failed
    failed = runAstConstructorTests(compiler, 'bootstrap', bundlePath) || failed
    failed = testFormatter() || failed
  } catch (err) {
    console.error('FAIL loading bootstrap oracle:', err.message)
    process.exit(1)
  }

  if (failed) {
    process.exit(1)
  }
  console.log('compiler parity: all checks passed')
}

main()
