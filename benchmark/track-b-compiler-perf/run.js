'use strict'

// Track B: Compiler performance.
// Measures per-stage transpile time for every single-file example, tests
// scaling behavior on synthetic large inputs, and compares against a rough
// tsc baseline.

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const harness = require('../lib/harness.js')

const ROOT = path.join(__dirname, '..', '..')
const EXAMPLES_DIR = path.join(ROOT, 'examples')

const { Lexer, Parser, Checker, Codegen } = harness.loadCompiler()

function countLines(source) {
  // Count lines the same way editors do: trailing newline doesn't add a line.
  let n = source.split('\n').length
  if (source.endsWith('\n')) n -= 1
  return n
}

function fullPipeline(source) {
  const tokens = new Lexer(source).tokenize()
  const { ast, errors } = new Parser(tokens).parse()
  if (errors && errors.length > 0) {
    throw new Error('parse errors: ' + errors[0].message)
  }
  new Checker().check(ast)
  return new Codegen().generate(ast)
}

// ── Task 1: per-stage timing on single-file examples ─────────────────────────

function benchPerStage() {
  // Only top-level .axn files; the bazaar/chronicle/dungeon subdirectories are
  // multi-file projects with imports and are skipped.
  const files = fs
    .readdirSync(EXAMPLES_DIR)
    .filter((f) => f.endsWith('.axn'))
    .sort()

  const opts = { warmup: 5, iterations: 30 }
  const rows = []

  for (const file of files) {
    const filePath = path.join(EXAMPLES_DIR, file)
    const source = fs.readFileSync(filePath, 'utf8')
    const bytes = Buffer.byteLength(source, 'utf8')
    const lines = countLines(source)

    // Fixed inputs for the isolated stage benchmarks.
    const tokens = new Lexer(source).tokenize()
    const { ast } = new Parser(tokens).parse()

    const lexStats = harness.bench(() => new Lexer(source).tokenize(), opts)
    const parseStats = harness.bench(() => new Parser(tokens).parse(), opts)
    const checkStats = harness.bench(() => new Checker().check(ast), opts)
    const codegenStats = harness.bench(() => new Codegen().generate(ast), opts)
    const totalStats = harness.bench(() => fullPipeline(source), opts)

    const totalSec = totalStats.median / 1000
    rows.push({
      file: `examples/${file}`,
      bytes,
      lines,
      tokens: tokens.length,
      lexMs: lexStats.median,
      parseMs: parseStats.median,
      checkMs: checkStats.median,
      codegenMs: codegenStats.median,
      totalMs: totalStats.median,
      linesPerSec: totalSec > 0 ? lines / totalSec : 0,
      tokensPerSec: totalSec > 0 ? tokens.length / totalSec : 0,
    })
    process.stdout.write(`  measured ${file}\n`)
  }
  return rows
}

// ── Task 2: scaling on synthetic large inputs ─────────────────────────────────

function benchScaling() {
  const base = fs.readFileSync(path.join(EXAMPLES_DIR, 'rpg.axn'), 'utf8')
  const baseLines = countLines(base)
  const targets = [1000, 5000, 10000, 25000, 50000]

  // The full pipeline (check + codegen included) tolerates repeated top-level
  // declarations — verified up-front below — so we measure the full transpile.
  const doubled = base + '\n' + base
  let measured = 'full'
  try {
    fullPipeline(doubled)
  } catch (e) {
    measured = 'lex+parse'
  }

  const points = []
  for (const target of targets) {
    const reps = Math.max(1, Math.round(target / baseLines))
    const source = new Array(reps).fill(base).join('\n')
    const lines = countLines(source)

    const run =
      measured === 'full'
        ? () => fullPipeline(source)
        : () => {
            const tokens = new Lexer(source).tokenize()
            new Parser(tokens).parse()
          }

    // Fewer iterations at the largest sizes to keep total runtime sane.
    const iterations = lines >= 40000 ? 7 : lines >= 20000 ? 10 : 15
    const stats = harness.bench(run, { warmup: 3, iterations })

    points.push({
      lines,
      totalMs: stats.median,
      msPerLine: stats.median / lines,
      measured,
    })
    process.stdout.write(`  scaling: ${lines} lines -> ${stats.median.toFixed(1)} ms\n`)
  }

  const first = points[0]
  const last = points[points.length - 1]
  const lineRatio = last.lines / first.lines
  const timeRatio = last.totalMs / first.totalMs
  // log-log slope: 1.0 = perfectly linear, 2.0 = quadratic.
  const slope = Math.log(timeRatio) / Math.log(lineRatio)

  let verdict
  if (slope <= 1.15) verdict = 'linear'
  else if (slope <= 1.4) verdict = 'mildly superlinear'
  else verdict = 'superlinear'

  const scalingNote =
    `Synthetic inputs built by repeating examples/rpg.axn (${baseLines} lines); measured stage(s): ${measured}. ` +
    `Time grew ${timeRatio.toFixed(1)}x while lines grew ${lineRatio.toFixed(1)}x ` +
    `(${first.lines} -> ${last.lines} lines), log-log slope ${slope.toFixed(2)} ` +
    `(1.0 = linear, 2.0 = quadratic). ms/line at each size: ` +
    points.map((p) => `${p.lines}: ${p.msPerLine.toFixed(4)}`).join(', ')

  return { points, verdict, scalingNote, lineRatio, timeRatio, slope }
}

// ── Task 3: tsc baseline ──────────────────────────────────────────────────────

function benchTsc() {
  const tsFile = path.join(EXAMPLES_DIR, 'controls.ts')
  const lines = countLines(fs.readFileSync(tsFile, 'utf8'))
  const args = ['tsc', '--noEmit', '--skipLibCheck', 'examples/controls.ts']

  const runs = []
  for (let i = 0; i < 5; i++) {
    const start = harness.nowNs()
    const res = spawnSync('npx', args, { cwd: ROOT, encoding: 'utf8' })
    const ms = harness.nsToMs(harness.nowNs() - start)
    if (res.status !== 0) {
      throw new Error(`tsc exited with ${res.status}: ${(res.stdout || '') + (res.stderr || '')}`)
    }
    runs.push(ms)
    process.stdout.write(`  tsc run ${i + 1}: ${ms.toFixed(0)} ms\n`)
  }
  runs.sort((a, b) => a - b)
  const coldMs = runs[Math.floor(runs.length / 2)]

  return {
    file: 'examples/controls.ts',
    lines,
    coldMs,
    linesPerSec: lines / (coldMs / 1000),
    note:
      'tsc timed as a cold process spawn (npx tsc --noEmit --skipLibCheck), median of 5 runs, so it ' +
      'pays Node startup + tsc bootstrapping + full type checking on every run. Axon numbers are ' +
      'in-process, warmed-up, JIT-friendly loops with no process overhead, so this comparison is ' +
      'rough and flatters Axon. It is a ballpark industry reference, not an apples-to-apples race.',
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log('Track B: compiler performance\n')

  console.log('Per-stage timing (warmup 5, 30 iterations, median ms):')
  const perStage = benchPerStage()

  const totalLines = perStage.reduce((a, r) => a + r.lines, 0)
  const totalTokens = perStage.reduce((a, r) => a + r.tokens, 0)
  const totalMs = perStage.reduce((a, r) => a + r.totalMs, 0)
  const aggregate = {
    totalLinesPerSec: totalLines / (totalMs / 1000),
    totalTokensPerSec: totalTokens / (totalMs / 1000),
  }

  console.log('\nScaling test (synthetic inputs from rpg.axn):')
  const scaling = benchScaling()

  console.log('\ntsc baseline:')
  const tscBaseline = benchTsc()

  // ── Findings ──
  const rpg = perStage.find((r) => r.file.endsWith('rpg.axn'))
  const stageTotals = { lex: 0, parse: 0, check: 0, codegen: 0 }
  for (const r of perStage) {
    stageTotals.lex += r.lexMs
    stageTotals.parse += r.parseMs
    stageTotals.check += r.checkMs
    stageTotals.codegen += r.codegenMs
  }
  const stageSum = stageTotals.lex + stageTotals.parse + stageTotals.check + stageTotals.codegen
  const dominantStage = Object.entries(stageTotals).sort((a, b) => b[1] - a[1])[0]

  const findings = [
    `Largest single file (examples/rpg.axn, ${rpg.lines} lines / ${rpg.tokens} tokens) transpiles in ` +
      `${rpg.totalMs.toFixed(2)} ms median (${Math.round(rpg.linesPerSec).toLocaleString()} lines/sec).`,
    `Aggregate throughput across all ${perStage.length} single-file examples: ` +
      `${Math.round(aggregate.totalLinesPerSec).toLocaleString()} lines/sec, ` +
      `${Math.round(aggregate.totalTokensPerSec).toLocaleString()} tokens/sec.`,
    `${dominantStage[0]} is the most expensive stage (${((dominantStage[1] / stageSum) * 100).toFixed(0)}% ` +
      `of summed per-stage time across all files).`,
    `Scaling verdict: ${scaling.verdict}. Time grew ${scaling.timeRatio.toFixed(1)}x for a ` +
      `${scaling.lineRatio.toFixed(1)}x increase in lines (log-log slope ${scaling.slope.toFixed(2)}).`,
    `Rough tsc reference: ${Math.round(tscBaseline.linesPerSec).toLocaleString()} lines/sec cold vs Axon's ` +
      `${Math.round(aggregate.totalLinesPerSec).toLocaleString()} lines/sec in-process — see tscBaseline.note ` +
      `for why this comparison is generous to Axon.`,
  ]

  const resultFile = harness.writeResult('track-b-compiler-perf', {
    perStage,
    aggregate,
    scaling: scaling.points,
    scalingVerdict: scaling.verdict,
    scalingNote: scaling.scalingNote,
    tscBaseline,
    findings,
  })

  // ── Console summary ──
  console.log('\n── Per-file results (median ms) ──')
  const header = ['file', 'lines', 'tokens', 'lex', 'parse', 'check', 'codegen', 'total', 'lines/s']
  const table = perStage.map((r) => [
    path.basename(r.file),
    String(r.lines),
    String(r.tokens),
    r.lexMs.toFixed(2),
    r.parseMs.toFixed(2),
    r.checkMs.toFixed(2),
    r.codegenMs.toFixed(2),
    r.totalMs.toFixed(2),
    Math.round(r.linesPerSec).toLocaleString(),
  ])
  const widths = header.map((h, i) => Math.max(h.length, ...table.map((row) => row[i].length)))
  const fmt = (row) => row.map((c, i) => c.padStart(widths[i])).join('  ')
  console.log(fmt(header))
  for (const row of table) console.log(fmt(row))

  console.log('\n── Scaling ──')
  for (const p of scaling.points) {
    console.log(
      `  ${String(p.lines).padStart(6)} lines: ${p.totalMs.toFixed(1).padStart(8)} ms ` +
        `(${(p.msPerLine * 1000).toFixed(1)} us/line, ${p.measured})`
    )
  }
  console.log(`  verdict: ${scaling.verdict} (slope ${scaling.slope.toFixed(2)})`)

  console.log('\n── Findings ──')
  for (const f of findings) console.log(`  - ${f}`)

  console.log(`\nResults written to ${path.relative(ROOT, resultFile)}`)
}

main()
