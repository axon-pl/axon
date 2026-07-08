#!/usr/bin/env node
// Copy dist/compiler.bootstrap.js → bootstrap/seed.js after fixed-point verification.
// Run: npm run update:seed

const fs   = require('fs')
const path = require('path')
const { ROOT } = require('./bootstrap_common')

const SRC  = path.join(ROOT, 'dist', 'compiler.bootstrap.js')
const DEST = path.join(ROOT, 'bootstrap', 'seed.js')

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('missing dist/compiler.bootstrap.js — run npm run build:toolchain && npm run test:fixed-point')
    process.exit(1)
  }
  fs.mkdirSync(path.dirname(DEST), { recursive: true })
  fs.copyFileSync(SRC, DEST)
  const bytes = fs.statSync(DEST).size
  console.log(`✓ updated bootstrap/seed.js (${bytes} bytes)`)
}

main()
