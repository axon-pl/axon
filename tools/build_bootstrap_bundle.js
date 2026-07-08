#!/usr/bin/env node
// Build a bootstrap compiler bundle from seed or existing bootstrap.
// Run: npm run build:bootstrap

const fs   = require('fs')
const path = require('path')
const { ROOT, buildBootstrapBundle } = require('./bootstrap_common')
const { SEED, BOOTSTRAP } = require('./oracle')

function defaultCompiler() {
  if (fs.existsSync(BOOTSTRAP)) return BOOTSTRAP
  if (fs.existsSync(SEED)) return SEED
  throw new Error('missing bootstrap/seed.js — commit seed or run from a built tree')
}

function parseArgs(argv) {
  let compiler = defaultCompiler()
  let out = BOOTSTRAP
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--compiler' && argv[i + 1]) {
      compiler = path.resolve(argv[++i])
    } else if (argv[i] === '--out' && argv[i + 1]) {
      out = path.resolve(argv[++i])
    }
  }
  return { compiler, out }
}

function main() {
  const { compiler, out } = parseArgs(process.argv.slice(2))
  const outDir = path.dirname(out)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const info = buildBootstrapBundle(compiler, out)
  const tag = path.basename(compiler) + ' → ' + path.basename(out)
  console.log(`✓ Bootstrap bundle: ${info.modules.join(' + ')} (${tag})`)
  console.log(`  ${info.modules.length} modules → ${info.lines} lines JS`)
}

main()
