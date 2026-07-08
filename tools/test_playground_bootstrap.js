#!/usr/bin/env node
// Verify bootstrap compiler compiles every playground example snippet.
// Run: npm run test:playground-bootstrap

const fs   = require('fs')
const path = require('path')
const vm   = require('vm')
const { ROOT, validateJs } = require('./bootstrap_common')
const { loadOracle, compilerPath } = require('./oracle')
const PLAYGROUND = path.join(ROOT, 'demo', 'playground.html')

function extractExamples(html) {
  const start = html.indexOf('const EXAMPLES = {')
  if (start < 0) throw new Error('could not find EXAMPLES in playground.html')
  const examples = {}
  const re = /^\s{2}([a-zA-Z0-9_]+):\s*`/gm
  let m
  const body = html.slice(start)
  while ((m = re.exec(body)) !== null) {
    const key = m[1]
    const tick = body.indexOf('`', m.index + m[0].length - 1)
    let i = tick + 1
    while (i < body.length) {
      if (body[i] === '\\') { i += 2; continue }
      if (body[i] === '`') break
      i++
    }
    if (i >= body.length) throw new Error(`unclosed template for ${key}`)
    examples[key] = body.slice(tick + 1, i)
  }
  return examples
}

function main() {
  if (!fs.existsSync(compilerPath())) {
    console.error('missing bootstrap compiler — run npm run build:toolchain')
    process.exit(1)
  }

  const compiler = loadOracle()
  const html = fs.readFileSync(PLAYGROUND, 'utf8')
  const examples = extractExamples(html)
  const names = Object.keys(examples).sort()

  console.log(`── playground examples via bootstrap (${names.length} snippets) ──`)
  let failed = false
  for (const name of names) {
    const src = examples[name]
    try {
      const result = compiler.compile(src)
      const err = validateJs(result.js || '')
      if (err || !result.js) {
        failed = true
        console.error(`FAIL ${name}: ${err || 'no JS emitted'}`)
        continue
      }
      console.log(`ok  ${name} (${result.js.length}B)`)
    } catch (e) {
      failed = true
      console.error(`FAIL ${name}:`, e.message)
    }
  }

  if (failed) {
    console.error('\nplayground bootstrap: FAILED')
    process.exit(1)
  }
  console.log('\nplayground bootstrap: all examples compile ✓')
}

main()
