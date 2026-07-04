// ─────────────────────────────────────────────────────────────────────────────
// Axon v0.4.0 — CLI entry point
// Usage: node dist/cli.js <input.axn> [output.js] [--test]
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'fs'
import * as path from 'path'
import { Lexer } from './lexer.js'
import { Parser, ParseError } from './parser.js'
import { Checker } from './checker.js'
import { Codegen } from './codegen.js'

function transpile(source: string, filename: string): { js: string; warnings: string[] } {
  const tokens = new Lexer(source).tokenize()
  const ast    = new Parser(tokens).parse()
  const diagnostics = new Checker().check(ast)
  const warnings = diagnostics.map(d => `  ${d.severity.toUpperCase()} [line ${d.line}]: ${d.message}`)
  const js = new Codegen().generate(ast)
  return { js, warnings }
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
  Axon v0.4.0 Transpiler
  ──────────────────────
  Usage:
    axon <input.axn> [output.js]    Transpile to JS
    axon --test <input.axn>         Transpile and run @test declarations

  If output.js is omitted, transpiled JS is written to stdout.
  `)
    process.exit(0)
  }

  // --test mode: transpile and execute @test declarations via Node vm
  if (args[0] === '--test') {
    const inputPath = path.resolve(args[1] ?? '')
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`)
      process.exit(1)
    }
    const source = fs.readFileSync(inputPath, 'utf8')
    try {
      const { js, warnings } = transpile(source, inputPath)
      if (warnings.length > 0) {
        console.warn(`⚠  Axon checker warnings:`)
        warnings.forEach(w => console.warn(w))
      }
      // Execute in a vm context so __axon_tests is accessible
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

  const inputPath  = path.resolve(args[0])
  const outputPath = args[1] ? path.resolve(args[1]) : null

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`)
    process.exit(1)
  }

  const source = fs.readFileSync(inputPath, 'utf8')

  try {
    const { js, warnings } = transpile(source, inputPath)

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
