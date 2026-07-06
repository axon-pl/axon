// ─────────────────────────────────────────────────────────────────────────────
// Axon v0.9.5 — CLI entry point
// Usage: node dist/cli.js <input.axn> [output.js] [--test] [--bundle]
//        node dist/cli.js --fmt <input.axn>
//        node dist/cli.js --check <input.axn>
//        node dist/cli.js --watch <input.axn> [output.js]
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs'
import * as path from 'path'
import { Lexer } from './lexer.js'
import { Parser, ParseError } from './parser.js'
import { Checker } from './checker.js'
import { Codegen } from './codegen.js'
import { AXON_STDLIB } from './stdlib.js'
import { format } from './formatter.js'
import { Program } from './types.js'

// ── Transpile helpers ─────────────────────────────────────────────────────────

function parseSource(source: string): { ast: Program; parseErrors: ParseError[] } {
  const tokens = new Lexer(source).tokenize()
  const { ast, errors } = new Parser(tokens).parse()
  return { ast, parseErrors: errors }
}

function transpileSource(source: string): { js: string; warnings: string[] } {
  const { ast, parseErrors } = parseSource(source)
  if (parseErrors.length > 0) {
    const msgs = parseErrors.map(e => `  ERROR ${e.message}`)
    throw new Error(`Parse errors:\n${msgs.join('\n')}`)
  }
  const diagnostics = new Checker().check(ast)
  const warnings = diagnostics.map(d => `  ${d.severity.toUpperCase()} [line ${d.line}]: ${d.message}`)
  const js = new Codegen().generate(ast)
  return { js, warnings }
}

// ── v0.5: Multi-file bundler ──────────────────────────────────────────────────

interface ModuleEntry {
  absPath: string
  source: string
  ast: Program
  imports: string[]
}

function parseModule(absPath: string): ModuleEntry {
  const source = fs.readFileSync(absPath, 'utf8')
  const { ast, parseErrors } = parseSource(source)
  if (parseErrors.length > 0) {
    const msgs = parseErrors.map(e => `  ${e.message}`)
    throw new Error(`Parse errors in ${path.basename(absPath)}:\n${msgs.join('\n')}`)
  }
  const dir = path.dirname(absPath)
  const imports: string[] = []
  for (const decl of ast.body) {
    if (decl.kind === 'ImportDecl') {
      const resolved = path.resolve(dir, decl.source.endsWith('.axn') ? decl.source : decl.source + '.axn')
      imports.push(resolved)
    }
  }
  return { absPath, source, ast, imports }
}

function buildBundle(entryPath: string): { js: string; warnings: string[]; files: string[] } {
  const visited = new Map<string, ModuleEntry>()
  const order: string[] = []

  function visit(absPath: string): void {
    if (visited.has(absPath)) return
    if (!fs.existsSync(absPath)) throw new Error(`Module not found: ${absPath}`)
    const entry = parseModule(absPath)
    visited.set(absPath, entry)
    for (const dep of entry.imports) visit(dep)
    order.push(absPath)
  }

  visit(entryPath)

  const allWarnings: string[] = []
  const jsParts: string[] = []
  let isFirst = true

  for (const absPath of order) {
    const entry = visited.get(absPath)!
    const diagnostics = new Checker().check(entry.ast)
    const warnings = diagnostics.map(d =>
      `  ${d.severity.toUpperCase()} [${path.basename(absPath)} line ${d.line}]: ${d.message}`
    )
    allWarnings.push(...warnings)
    const js = new Codegen().generate(entry.ast, isFirst)
    isFirst = false
    jsParts.push(`// ─── ${path.basename(absPath)} ${'─'.repeat(Math.max(0, 50 - path.basename(absPath).length))}`)
    jsParts.push(js)
  }

  return { js: jsParts.join('\n'), warnings: allWarnings, files: order.map(p => path.basename(p)) }
}

// ── main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
  Axon v0.9.5 Transpiler
  ──────────────────────
  Usage:
    axon <input.axn> [output.js]           Transpile a single file to JS
    axon --bundle <input.axn> [out.js]     Bundle multi-file project (resolves imports)
    axon --test <input.axn>                Transpile and run @test declarations
    axon --fmt <input.axn>                 Format Axon source in-place
    axon --check <input.axn>              Static analysis only — no emit
    axon --watch <input.axn> [output.js]  Watch and recompile on change

  If output.js is omitted, transpiled JS is written to stdout.
  Multiple parse errors are reported together (v0.9.5).
  `)
    process.exit(0)
  }

  // ── axon --fmt ─────────────────────────────────────────────────────────────
  if (args[0] === '--fmt') {
    const inputPath = path.resolve(args[1] ?? '')
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    const source = fs.readFileSync(inputPath, 'utf8')
    const { formatted, changed } = format(source)
    if (changed) {
      fs.writeFileSync(inputPath, formatted, 'utf8')
      console.log(`✓ Formatted ${path.basename(inputPath)}`)
    } else {
      console.log(`✓ ${path.basename(inputPath)} — already formatted`)
    }
    return
  }

  // ── axon --check ───────────────────────────────────────────────────────────
  if (args[0] === '--check') {
    const inputPath = path.resolve(args[1] ?? '')
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    const source = fs.readFileSync(inputPath, 'utf8')
    try {
      const { ast, parseErrors } = parseSource(source)
      if (parseErrors.length > 0) {
        console.error(`${parseErrors.length} parse error${parseErrors.length > 1 ? 's' : ''} in ${path.basename(inputPath)}:`)
        for (const e of parseErrors) console.error(`  ${e.message}`)
        process.exit(1)
      }
      const diagnostics = new Checker().check(ast)
      if (diagnostics.length === 0) {
        console.log(`✓ ${path.basename(inputPath)} — no issues`)
      } else {
        for (const d of diagnostics) console.warn(`  ${d.severity.toUpperCase()} [line ${d.line}]: ${d.message}`)
        process.exit(1)
      }
    } catch (e: any) {
      console.error(`Error: ${e.message}`)
      process.exit(1)
    }
    return
  }

  // ── axon --watch ──────────────────────────────────────────────────────────
  if (args[0] === '--watch') {
    const inputPath  = path.resolve(args[1] ?? '')
    const outputPath = args[2] ? path.resolve(args[2]) : null
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    let debounce: ReturnType<typeof setTimeout> | null = null
    function recompile(): void {
      const source = fs.readFileSync(inputPath, 'utf8')
      try {
        const { js, warnings } = transpileSource(source)
        if (warnings.length > 0) warnings.forEach(w => console.warn(w))
        if (outputPath) {
          fs.writeFileSync(outputPath, js, 'utf8')
          console.log(`[${new Date().toLocaleTimeString()}] ✓ ${path.basename(inputPath)} → ${path.basename(outputPath)}`)
        } else {
          process.stdout.write(js)
        }
      } catch (e: any) {
        console.error(`[${new Date().toLocaleTimeString()}] ✗ ${e.message}`)
      }
    }
    recompile()
    console.log(`  Watching ${path.basename(inputPath)} — press Ctrl+C to stop`)
    fs.watch(inputPath, () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(recompile, 80)
    })
    return
  }

  // ── axon --test ────────────────────────────────────────────────────────────
  if (args[0] === '--test') {
    const inputPath = path.resolve(args[1] ?? '')
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    try {
      let js: string
      let warnings: string[]
      const source = fs.readFileSync(inputPath, 'utf8')
      if (/^\s*import\s*\{/m.test(source)) {
        const bundle = buildBundle(inputPath)
        js = bundle.js; warnings = bundle.warnings
      } else {
        const result = transpileSource(source)
        js = result.js; warnings = result.warnings
      }
      if (warnings.length > 0) {
        console.warn(`⚠  Axon checker warnings:`)
        warnings.forEach(w => console.warn(w))
      }
      const vm = require('vm') as typeof import('vm')
      const ctx: any = { console, process, Math, JSON, Array, Object, Map, Set, String, Number, Boolean }
      vm.createContext(ctx)
      vm.runInContext(AXON_STDLIB, ctx)
      vm.runInContext('{\n' + js + '\n}', ctx)
      const result = ctx.__runAxonTests?.() ?? { passed: 0, failed: 0, total: 0, results: [] }
      console.log(`\n  Axon tests — ${path.basename(inputPath)}`)
      console.log(`  ${'─'.repeat(40)}`)
      for (const r of result.results) {
        console.log(`  ${r.ok ? '✓' : '✗'} ${r.desc}${r.error ? `  (${r.error})` : ''}`)
      }
      console.log(`  ${'─'.repeat(40)}`)
      console.log(`  ${result.passed} passed, ${result.failed} failed, ${result.total} total\n`)
      if (result.failed > 0) process.exit(1)
    } catch (e: any) {
      console.error(`Error: ${e.message ?? e}`)
      process.exit(1)
    }
    return
  }

  // ── axon --bundle ─────────────────────────────────────────────────────────
  if (args[0] === '--bundle') {
    const inputPath  = path.resolve(args[1] ?? '')
    const outputPath = args[2] ? path.resolve(args[2]) : null
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    try {
      const bundle = buildBundle(inputPath)
      if (bundle.warnings.length > 0) {
        console.warn(`⚠  Axon checker warnings:`)
        bundle.warnings.forEach(w => console.warn(w))
      }
      if (outputPath) {
        fs.writeFileSync(outputPath, bundle.js, 'utf8')
        const jsLines = bundle.js.split('\n').filter(l => l.trim()).length
        const warnStr = bundle.warnings.length > 0 ? ` (${bundle.warnings.length} warning${bundle.warnings.length > 1 ? 's' : ''})` : ''
        console.log(`✓ Bundled ${bundle.files.join(' + ')} → ${path.basename(outputPath)}${warnStr}`)
        console.log(`  ${bundle.files.length} modules → ${jsLines} lines JS`)
      } else {
        process.stdout.write(bundle.js)
      }
    } catch (e: any) {
      console.error(`Error: ${e.message ?? e}`)
      process.exit(1)
    }
    return
  }

  // ── Single-file transpile ─────────────────────────────────────────────────
  const inputPath  = path.resolve(args[0])
  const outputPath = args[1] ? path.resolve(args[1]) : null

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`)
    process.exit(1)
  }

  const source = fs.readFileSync(inputPath, 'utf8')
  try {
    const { js, warnings } = transpileSource(source)
    if (warnings.length > 0) {
      console.warn(`⚠  Axon checker warnings:`)
      warnings.forEach(w => console.warn(w))
    }
    if (outputPath) {
      fs.writeFileSync(outputPath, js, 'utf8')
      const srcLines = source.split('\n').filter(l => l.trim()).length
      const jsLines  = js.split('\n').filter(l => l.trim()).length
      const warnStr  = warnings.length > 0 ? ` (${warnings.length} warning${warnings.length > 1 ? 's' : ''})` : ''
      console.log(`✓ Transpiled ${path.basename(inputPath)} → ${path.basename(outputPath)}${warnStr}`)
      console.log(`  ${srcLines} lines Axon → ${jsLines} lines JS`)
    } else {
      process.stdout.write(js)
    }
  } catch (e: any) {
    console.error(`Error: ${e.message ?? e}`)
    process.exit(1)
  }
}

main()
