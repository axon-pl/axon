// ─────────────────────────────────────────────────────────────────────────────
// Axon v0.5.0 — CLI entry point
// Usage: node dist/cli.js <input.axn> [output.js] [--test] [--bundle]
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs'
import * as path from 'path'
import { Lexer } from './lexer.js'
import { Parser, ParseError } from './parser.js'
import { Checker } from './checker.js'
import { Codegen } from './codegen.js'
import { Program, ImportDecl } from './types.js'

// ── Single-file transpile (no import resolution) ─────────────────────────────

function transpileSource(source: string): { js: string; warnings: string[] } {
  const tokens = new Lexer(source).tokenize()
  const ast    = new Parser(tokens).parse()
  const diagnostics = new Checker().check(ast)
  const warnings = diagnostics.map(d => `  ${d.severity.toUpperCase()} [line ${d.line}]: ${d.message}`)
  const js = new Codegen().generate(ast)
  return { js, warnings }
}

// ── v0.5: Multi-file bundler ──────────────────────────────────────────────────
// Resolves imports recursively, sorts by dependency order (topo-sort),
// strips stdlib header from all but the first file, and concatenates output.

interface ModuleEntry {
  absPath: string
  source: string
  ast: Program
  imports: string[]   // absolute paths of imported modules
}

function parseModule(absPath: string): ModuleEntry {
  const source = fs.readFileSync(absPath, 'utf8')
  const tokens = new Lexer(source).tokenize()
  const ast    = new Parser(tokens).parse()
  const dir    = path.dirname(absPath)

  const imports: string[] = []
  for (const decl of ast.body) {
    if (decl.kind === 'ImportDecl') {
      // Resolve relative paths from the importing file's directory
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
    if (!fs.existsSync(absPath)) {
      throw new Error(`Module not found: ${absPath}`)
    }

    const entry = parseModule(absPath)
    visited.set(absPath, entry)

    // Visit all imports first (depth-first → dependencies come before dependents)
    for (const dep of entry.imports) {
      visit(dep)
    }
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

    // Only the first module in bundle order emits the stdlib preamble
    const js = new Codegen().generate(entry.ast, isFirst)
    isFirst = false

    jsParts.push(`// ─── ${path.basename(absPath)} ${'─'.repeat(Math.max(0, 50 - path.basename(absPath).length))}`)
    jsParts.push(js)
  }

  return {
    js: jsParts.join('\n'),
    warnings: allWarnings,
    files: order.map(p => path.basename(p)),
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
  Axon v0.5.0 Transpiler
  ──────────────────────
  Usage:
    axon <input.axn> [output.js]         Transpile a single file to JS
    axon --bundle <input.axn> [out.js]   Bundle multi-file project (resolves imports)
    axon --test <input.axn>              Transpile and run @test declarations

  If output.js is omitted, transpiled JS is written to stdout.
  `)
    process.exit(0)
  }

  // --test mode
  if (args[0] === '--test') {
    const inputPath = path.resolve(args[1] ?? '')
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    try {
      let js: string
      let warnings: string[]

      // Auto-detect if the file uses imports → bundle mode for tests
      const source = fs.readFileSync(inputPath, 'utf8')
      if (/^\s*import\s*\{/m.test(source)) {
        const bundle = buildBundle(inputPath)
        js = bundle.js
        warnings = bundle.warnings
      } else {
        const result = transpileSource(source)
        js = result.js
        warnings = result.warnings
      }

      if (warnings.length > 0) {
        console.warn(`⚠  Axon checker warnings:`)
        warnings.forEach(w => console.warn(w))
      }
      const vm = require('vm') as typeof import('vm')
      const ctx: any = { console, process, Math, JSON, Array, Object, Map, Set, String, Number, Boolean }
      vm.createContext(ctx)
      vm.runInContext(js, ctx)
      const result = ctx.__runAxonTests?.() ?? { passed: 0, failed: 0, total: 0, results: [] }
      console.log(`\n  Axon tests — ${path.basename(inputPath)}`)
      console.log(`  ${'─'.repeat(40)}`)
      for (const r of result.results) {
        console.log(`  ${r.ok ? '✓' : '✗'} ${r.desc}${r.error ? `  (${r.error})` : ''}`)
      }
      console.log(`  ${'─'.repeat(40)}`)
      console.log(`  ${result.passed} passed, ${result.failed} failed, ${result.total} total\n`)
      if (result.failed > 0) process.exit(1)
    } catch (e) {
      if (e instanceof ParseError) console.error(`Parse error: ${e.message}`)
      else console.error(`Error: ${e}`)
      process.exit(1)
    }
    return
  }

  // --bundle mode
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
        const warnStr = bundle.warnings.length > 0
          ? ` (${bundle.warnings.length} warning${bundle.warnings.length > 1 ? 's' : ''})`
          : ''
        console.log(`✓ Bundled ${bundle.files.join(' + ')} → ${path.basename(outputPath)}${warnStr}`)
        console.log(`  ${bundle.files.length} modules → ${jsLines} lines JS`)
      } else {
        process.stdout.write(bundle.js)
      }
    } catch (e) {
      if (e instanceof ParseError) console.error(`Parse error: ${e.message}`)
      else console.error(`Error: ${e}`)
      process.exit(1)
    }
    return
  }

  // Single-file transpile
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
  } catch (e) {
    if (e instanceof ParseError) console.error(`Parse error: ${e.message}`)
    else console.error(`Error: ${e}`)
    process.exit(1)
  }
}

main()
