#!/usr/bin/env node
// Synth CLI backed by the bootstrap compiler bundle (no TS runtime).
// Run: npm run synth:bootstrap -- examples/hello.syn

const fs   = require('fs')
const path = require('path')
const vm   = require('vm')
const { ROOT, loadBundle, bundleSynProject, validateJs, extractStdlib } = require('./bootstrap_common')
const { compilerPath } = require('./oracle')

const STDLIB    = path.join(ROOT, 'demo', 'synth.stdlib.js')

function usage() {
  console.log(`
  Synth bootstrap CLI
  ───────────────────
  Usage:
    synth-bootstrap <input.syn> [output.js]     Transpile a single file
    synth-bootstrap --bundle <input.syn> [out]  Bundle multi-file project
    synth-bootstrap --test <input.syn>          Run @test declarations
    synth-bootstrap --check <input.syn>         Static analysis only
    synth-bootstrap --fmt <input.syn>           Format Synth source in-place

  Runtime: bootstrap/seed.js or dist/compiler.bootstrap.js
  `)
}

function loadStdlibForTests() {
  if (fs.existsSync(STDLIB)) {
    return fs.readFileSync(STDLIB, 'utf8').replace(/^(\/\/[^\n]*\n)+/, '')
  }
  return extractStdlib(fs.readFileSync(compilerPath(), 'utf8'))
}

function transpileFile(compiler, source) {
  const result = compiler.compile(source)
  const warnings = (result.warnings || []).map(w =>
    `  ${(w.severity || 'warning').toUpperCase()} [line ${w.line}]: ${w.message}`
  )
  const err = validateJs(result.js || '')
  if (err) {
    throw new Error(`codegen produced invalid JavaScript: ${err}`)
  }
  return { js: result.js, warnings }
}

function hasImports(source) {
  return /^\s*import\s*\{/m.test(source)
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args[0] === '--help') {
    usage()
    process.exit(0)
  }

  let compiler
  try {
    compiler = loadBundle(compilerPath())
  } catch (e) {
    console.error('missing bootstrap compiler — run npm run build:toolchain')
    process.exit(1)
  }

  if (args[0] === '--fmt') {
    const inputPath = path.resolve(args[1] ?? '')
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    const source = fs.readFileSync(inputPath, 'utf8')
    try {
      if (typeof compiler.format !== 'function') {
        console.error('Error: bootstrap bundle has no format export')
        process.exit(1)
      }
      const result = compiler.format(source)
      if (result.changed) {
        fs.writeFileSync(inputPath, result.formatted, 'utf8')
        console.log(`✓ Formatted ${path.basename(inputPath)}`)
      } else {
        console.log(`✓ ${path.basename(inputPath)} — already formatted`)
      }
    } catch (e) {
      console.error(`Error: ${e.message}`)
      process.exit(1)
    }
    return
  }

  if (args[0] === '--check') {
    const inputPath = path.resolve(args[1] ?? '')
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    const source = fs.readFileSync(inputPath, 'utf8')
    try {
      const warnings = compiler.check_source(source)
      if (warnings.length === 0) {
        console.log(`✓ ${path.basename(inputPath)} — no issues`)
      } else {
        console.log(`${warnings.length} issue${warnings.length > 1 ? 's' : ''} in ${path.basename(inputPath)}:`)
        for (const w of warnings) {
          console.log(`  ${(w.severity || 'warning').toUpperCase()} [line ${w.line}]: ${w.message}`)
        }
        process.exit(warnings.some(w => w.severity === 'error') ? 1 : 0)
      }
    } catch (e) {
      console.error(`Error: ${e.message}`)
      process.exit(1)
    }
    return
  }

  if (args[0] === '--test') {
    const inputPath = path.resolve(args[1] ?? '')
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    const source = fs.readFileSync(inputPath, 'utf8')
    try {
      let js
      let warnings
      if (hasImports(source)) {
        const bundle = bundleSynProject(compilerPath(), inputPath, { headerComments: false })
        js = bundle.js
        warnings = bundle.warnings
      } else {
        const result = transpileFile(compiler, source)
        js = result.js
        warnings = result.warnings
      }
      if (warnings.length > 0) {
        console.warn('⚠  Synth checker warnings:')
        warnings.forEach(w => console.warn(w))
      }
      const ctx = vm.createContext({
        console, process, Math, JSON, Array, Object, Map, Set, String, Number, Boolean,
        globalThis: {},
      })
      ctx.globalThis = ctx
      vm.runInContext(loadStdlibForTests(), ctx)
      vm.runInContext('{\n' + js + '\n}', ctx)
      const summary = ctx.__runSynthTests?.() ?? { passed: 0, failed: 0, total: 0, results: [] }
      console.log(`\n  Synth tests — ${path.basename(inputPath)} (bootstrap)`)
      console.log(`  ${'─'.repeat(40)}`)
      for (const r of summary.results || []) {
        console.log(`  ${r.ok ? '✓' : '✗'} ${r.desc}${r.error ? `  (${r.error})` : ''}`)
      }
      console.log(`  ${'─'.repeat(40)}`)
      console.log(`  ${summary.passed} passed, ${summary.failed} failed, ${summary.total} total\n`)
      if (summary.failed > 0) process.exit(1)
    } catch (e) {
      console.error(`Error: ${e.message ?? e}`)
      process.exit(1)
    }
    return
  }

  if (args[0] === '--bundle') {
    const inputPath = path.resolve(args[1] ?? '')
    const outputPath = args[2] ? path.resolve(args[2]) : null
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    try {
      const bundle = bundleSynProject(compilerPath(), inputPath)
      if (bundle.warnings.length > 0) {
        console.warn('⚠  Synth checker warnings:')
        bundle.warnings.forEach(w => console.warn(w))
      }
      if (outputPath) {
        fs.writeFileSync(outputPath, bundle.js, 'utf8')
        const warnStr = bundle.warnings.length > 0
          ? ` (${bundle.warnings.length} warning${bundle.warnings.length > 1 ? 's' : ''})`
          : ''
        console.log(`✓ Bundled ${bundle.files.join(' + ')} → ${path.basename(outputPath)}${warnStr}`)
        console.log(`  ${bundle.files.length} modules → ${bundle.lines} lines JS (bootstrap)`)
      } else {
        process.stdout.write(bundle.js)
      }
    } catch (e) {
      console.error(`Error: ${e.message ?? e}`)
      process.exit(1)
    }
    return
  }

  const inputPath = path.resolve(args[0])
  const outputPath = args[1] ? path.resolve(args[1]) : null
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`)
    process.exit(1)
  }
  const source = fs.readFileSync(inputPath, 'utf8')
  try {
    let js
    let warnings
    if (hasImports(source)) {
      const bundle = bundleSynProject(BOOTSTRAP, inputPath, { headerComments: false })
      js = bundle.js
      warnings = bundle.warnings
    } else {
      const result = transpileFile(compiler, source)
      js = result.js
      warnings = result.warnings
    }
    if (warnings.length > 0) {
      console.warn('⚠  Synth checker warnings:')
      warnings.forEach(w => console.warn(w))
    }
    if (outputPath) {
      fs.writeFileSync(outputPath, js, 'utf8')
      console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)} (bootstrap)`)
    } else {
      process.stdout.write(js)
    }
  } catch (e) {
    console.error(`Error: ${e.message ?? e}`)
    process.exit(1)
  }
}

main()
