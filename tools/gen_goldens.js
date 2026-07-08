#!/usr/bin/env node
// Regenerate all compiler goldens from the bootstrap oracle.
// Run: npm run gen:goldens

const { execSync } = require('child_process')
const path = require('path')

const scripts = [
  'gen_lexer_goldens.js',
  'gen_ast_goldens.js',
  'gen_codegen_goldens.js',
  'gen_checker_goldens.js',
  'gen_bootstrap_goldens.js',
]

for (const script of scripts) {
  const p = path.join(__dirname, script)
  console.log(`\n── ${script} ──`)
  execSync(`node "${p}"`, { stdio: 'inherit' })
}

console.log('\n✓ all goldens regenerated from bootstrap oracle')
