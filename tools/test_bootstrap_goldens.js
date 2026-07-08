#!/usr/bin/env node
// Verify each compiler/*.syn module compiles to its bootstrap golden JS.
// Run: npm run test:bootstrap-goldens

const { loadOracle } = require('./oracle')
const { testBootstrapModuleGoldens } = require('./test_bootstrap_goldens_lib')

function main() {
  const failed = testBootstrapModuleGoldens(loadOracle())
  if (failed) {
    console.error('\nbootstrap goldens: FAILED (run npm run gen:goldens to refresh)')
    process.exit(1)
  }
  console.log('\nbootstrap goldens: all modules match ✓')
}

main()
