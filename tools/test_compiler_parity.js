// Parity harness: TS lexer oracle vs goldens; Synth lexer when bundle exists.

const fs = require('fs')
const path = require('path')
const { Lexer } = require('../dist/lexer.js')
const { Parser } = require('../dist/parser.js')

const FIXTURES_DIR = path.join(__dirname, '..', 'compiler', 'fixtures')
const GOLDENS_DIR  = path.join(__dirname, '..', 'compiler', 'goldens')
const SYNTH_BUNDLE = path.join(__dirname, '..', 'dist', 'compiler.synth.js')

function serializeTokens(tokens) {
  return tokens.map(t => ({
    type:  t.type,
    value: t.value,
    line:  t.line,
    col:   t.col,
  }))
}

function loadTokenGolden(name) {
  const p = path.join(GOLDENS_DIR, `tokens_${name}.json`)
  if (!fs.existsSync(p)) {
    throw new Error(`missing golden: ${p} (run npm run gen:lexer-goldens)`)
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function serializeAst(node) {
  if (node === null || node === undefined) return null
  if (typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(serializeAst)
  const out = {}
  for (const [key, value] of Object.entries(node)) {
    if (value === undefined) continue
    out[key] = serializeAst(value)
  }
  return out
}

function loadAstGolden(name) {
  const p = path.join(GOLDENS_DIR, `ast_${name}.json`)
  if (!fs.existsSync(p)) {
    throw new Error(`missing golden: ${p} (run npm run gen:ast-goldens)`)
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function diffJson(expected, actual, label, path = label) {
  const errors = []
  if (expected === actual) return errors
  if (typeof expected !== typeof actual) {
    errors.push(`${path}: type ${typeof expected} vs ${typeof actual}`)
    return errors
  }
  if (expected === null || actual === null || typeof expected !== 'object') {
    if (expected !== actual) {
      errors.push(`${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    }
    return errors
  }
  if (Array.isArray(expected) !== Array.isArray(actual)) {
    errors.push(`${path}: array mismatch`)
    return errors
  }
  if (Array.isArray(expected)) {
    const n = Math.max(expected.length, actual.length)
    for (let i = 0; i < n; i++) {
      errors.push(...diffJson(expected[i], actual[i], label, `${path}[${i}]`))
    }
    return errors
  }
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)])
  for (const key of [...keys].sort()) {
    if (!(key in expected)) {
      errors.push(`${path}.${key}: extra field ${JSON.stringify(actual[key])}`)
      continue
    }
    if (!(key in actual)) {
      errors.push(`${path}.${key}: missing field ${JSON.stringify(expected[key])}`)
      continue
    }
    errors.push(...diffJson(expected[key], actual[key], label, `${path}.${key}`))
  }
  return errors
}

function diffTokens(expected, actual, label) {
  const errors = []
  const n = Math.max(expected.length, actual.length)
  for (let i = 0; i < n; i++) {
    const e = expected[i]
    const a = actual[i]
    if (!e) {
      errors.push(`${label}[${i}]: extra token ${JSON.stringify(a)}`)
      continue
    }
    if (!a) {
      errors.push(`${label}[${i}]: missing token ${JSON.stringify(e)}`)
      continue
    }
    for (const key of ['type', 'value', 'line', 'col']) {
      if (e[key] !== a[key]) {
        errors.push(
          `${label}[${i}].${key}: expected ${JSON.stringify(e[key])}, got ${JSON.stringify(a[key])}`
        )
      }
    }
  }
  return errors
}

function testTsLexerVsGoldens() {
  const fixtures = fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.syn'))
    .sort()

  let failed = false
  for (const file of fixtures) {
    const name = path.basename(file, '.syn')
    const src  = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')
    const actual   = serializeTokens(new Lexer(src).tokenize())
    const expected = loadTokenGolden(name)
    const errors   = diffTokens(expected, actual, name)
    if (errors.length > 0) {
      failed = true
      console.error(`FAIL TS lexer vs golden: ${name}`)
      for (const e of errors.slice(0, 10)) console.error('  ', e)
      if (errors.length > 10) console.error(`  ... and ${errors.length - 10} more`)
    } else {
      console.log(`ok  TS lexer vs golden: ${name} (${actual.length} tokens)`)
    }
  }
  return failed
}

function loadSynthBundle(bundlePath) {
  const module = { exports: {} }
  const exports = module.exports
  const body = fs.readFileSync(bundlePath, 'utf8')
    + '\nmodule.exports = { compile, tokenize, parse, generate };'
  const vm = require('vm')
  const script = new vm.Script(body, { filename: bundlePath })
  script.runInNewContext({
    module,
    exports,
    console,
    String,
    Array,
    Math,
    Object,
    JSON,
    Map,
    Set,
  })
  return module.exports
}

function testSynthLexerVsGoldens() {
  if (!fs.existsSync(SYNTH_BUNDLE)) {
    console.log('skip Synth lexer (no dist/compiler.synth.js — run npm run build:compiler)')
    return false
  }

  let synth
  try {
    synth = loadSynthBundle(SYNTH_BUNDLE)
  } catch (err) {
    console.error('FAIL loading Synth compiler bundle:', err.message)
    return true
  }

  if (typeof synth.tokenize !== 'function') {
    console.error('FAIL Synth bundle: export tokenize not found')
    return true
  }

  const fixtures = fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.syn'))
    .sort()

  let failed = false
  for (const file of fixtures) {
    const name = path.basename(file, '.syn')
    const src  = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')
    try {
      const actual   = serializeTokens(synth.tokenize(src))
      const expected = loadTokenGolden(name)
      const errors   = diffTokens(expected, actual, `synth:${name}`)
      if (errors.length > 0) {
        failed = true
        console.error(`FAIL Synth lexer vs golden: ${name}`)
        for (const e of errors.slice(0, 10)) console.error('  ', e)
        if (errors.length > 10) console.error(`  ... and ${errors.length - 10} more`)
      } else {
        console.log(`ok  Synth lexer vs golden: ${name} (${actual.length} tokens)`)
      }
    } catch (err) {
      failed = true
      console.error(`FAIL Synth tokenize(${name}):`, err.message)
    }
  }
  return failed
}

function testTsParserVsGoldens() {
  const fixtures = fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.syn'))
    .sort()

  let failed = false
  for (const file of fixtures) {
    const name = path.basename(file, '.syn')
    const src = fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8')
    const tokens = new Lexer(src).tokenize()
    const { ast, errors } = new Parser(tokens).parse()
    if (errors.length > 0) {
      failed = true
      console.error(`FAIL TS parser errors in ${name}:`, errors.map(e => e.message).join('; '))
      continue
    }
    const actual = serializeAst(ast)
    const expected = loadAstGolden(name)
    const diffs = diffJson(expected, actual, name)
    if (diffs.length > 0) {
      failed = true
      console.error(`FAIL TS parser vs golden: ${name}`)
      for (const e of diffs.slice(0, 10)) console.error('  ', e)
      if (diffs.length > 10) console.error(`  ... and ${diffs.length - 10} more`)
    } else {
      console.log(`ok  TS parser vs golden: ${name}`)
    }
  }
  return failed
}

function testSynthAstConstructors() {
  const { execSync } = require('child_process')
  const cli = path.join(__dirname, '..', 'dist', 'cli.js')
  const testFile = path.join(__dirname, '..', 'compiler', 'ast_test.syn')
  try {
    const out = execSync(`node "${cli}" --test "${testFile}"`, { encoding: 'utf8' })
    if (!out.includes('0 failed')) {
      console.error('FAIL Synth AST constructor tests')
      console.error(out)
      return true
    }
    console.log('ok  Synth AST constructor tests')
    return false
  } catch (err) {
    console.error('FAIL Synth AST constructor tests:', err.stdout || err.message)
    return true
  }
}

function main() {
  let failed = false
  failed = testTsLexerVsGoldens() || failed
  failed = testSynthLexerVsGoldens() || failed
  failed = testTsParserVsGoldens() || failed
  failed = testSynthAstConstructors() || failed
  if (failed) process.exit(1)
  console.log('compiler parity: all checks passed')
}

main()
