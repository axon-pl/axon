// Bootstrap harness: seed compiler compiles each module; rebuilt bundle passes parity.
// Run: npm run test:bootstrap

const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { ROOT, validateJs } = require('./bootstrap_common')
const { loadOracle, compilerPath } = require('./oracle')
const { runBundleParityTests } = require('./parity_common')

const COMPILER_DIR = path.join(ROOT, 'compiler')
const GOLDENS_DIR  = path.join(ROOT, 'compiler', 'goldens')
const BOOTSTRAP    = path.join(ROOT, 'dist', 'compiler.bootstrap.js')

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

function testSelfHostModules(compiler) {
  let failed = false
  console.log('\n── self-host: compile each compiler module ──')

  for (const file of MODULES) {
    const name = path.basename(file, '.syn')
    const src = fs.readFileSync(path.join(COMPILER_DIR, file), 'utf8')
    try {
      const result = compiler.compile(src)
      const err = validateJs(result.js || '')
      if (err) {
        failed = true
        console.error(`FAIL ${file}: invalid JS — ${err}`)
        continue
      }
      let goldenNote = ''
      const goldenPath = path.join(GOLDENS_DIR, `bootstrap_${name}.js`)
      if (fs.existsSync(goldenPath)) {
        const golden = fs.readFileSync(goldenPath, 'utf8')
        goldenNote = ` (${result.js.length}B vs golden ${golden.length}B)`
      }
      console.log(`ok  ${file} → valid JS${goldenNote}`)
    } catch (e) {
      failed = true
      console.error(`FAIL ${file}:`, e.message)
    }
  }
  return failed
}

function main() {
  if (!fs.existsSync(compilerPath())) {
    console.error('missing bootstrap compiler — run npm run build:toolchain')
    process.exit(1)
  }

  let failed = false
  const compiler = loadOracle()
  failed = testSelfHostModules(compiler) || failed

  console.log('\n── build bootstrap bundle ──')
  execSync(`node "${path.join(__dirname, 'build_bootstrap_bundle.js')}"`, { stdio: 'inherit' })

  if (!fs.existsSync(BOOTSTRAP)) {
    console.error('FAIL bootstrap bundle not produced')
    process.exit(1)
  }

  console.log('\n── bootstrap bundle parity ──')
  const { loadBundle } = require('./bootstrap_common')
  let bootstrap
  try {
    bootstrap = loadBundle(BOOTSTRAP)
  } catch (e) {
    console.error('FAIL loading bootstrap bundle:', e.message)
    process.exit(1)
  }

  failed = runBundleParityTests(bootstrap, 'bootstrap') || failed

  if (failed) {
    console.error('\nbootstrap: checks FAILED')
    process.exit(1)
  }
  console.log('\nbootstrap: all checks passed ✓')
}

main()
