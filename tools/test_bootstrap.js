// Bootstrap harness: seed compiler compiles each module; rebuilt bundle passes parity.
// Run: npm run test:bootstrap

const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { ROOT } = require('./bootstrap_common')
const { loadOracle, compilerPath } = require('./oracle')
const { runBundleParityTests } = require('./parity_common')
const { testBootstrapModuleGoldens } = require('./test_bootstrap_goldens_lib')

const BOOTSTRAP = path.join(ROOT, 'dist', 'compiler.bootstrap.js')

function main() {
  if (!fs.existsSync(compilerPath())) {
    console.error('missing bootstrap compiler — run npm run build:toolchain')
    process.exit(1)
  }

  let failed = false
  const compiler = loadOracle()
  failed = testBootstrapModuleGoldens(compiler, { label: 'self-host: module goldens' }) || failed

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
