// Load the bootstrap compiler oracle (committed seed or rebuilt dist).

const fs   = require('fs')
const path = require('path')
const { ROOT, loadBundle } = require('./bootstrap_common')

const SEED      = path.join(ROOT, 'bootstrap', 'seed.js')
const BOOTSTRAP = path.join(ROOT, 'dist', 'compiler.bootstrap.js')

function compilerPath() {
  if (fs.existsSync(BOOTSTRAP)) return BOOTSTRAP
  if (fs.existsSync(SEED)) return SEED
  throw new Error('missing compiler — run npm run build:toolchain (need bootstrap/seed.js or dist/compiler.bootstrap.js)')
}

function loadOracle() {
  return loadBundle(compilerPath())
}

module.exports = { ROOT, SEED, BOOTSTRAP, compilerPath, loadOracle }
