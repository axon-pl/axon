'use strict'

// Track C — Runtime performance of Axon-generated JavaScript.
//
// 1. Dungeon generator head-to-head: Axon-generated JS vs a hand-written
//    idiomatic JS port (output equality verified first).
// 2. Feature microbenchmarks: `where`-constraint guard overhead and @memo.
// 3. Code size: controls.axn (+ generated JS) vs controls.ts (+ tsc JS).

const fs = require('fs')
const os = require('os')
const path = require('path')
const vm = require('vm')
const { execFileSync } = require('child_process')

const harness = require('../lib/harness.js')
const handwritten = require('./generator.handwritten.js')

const REPO = path.join(__dirname, '..', '..')
const compiler = harness.loadCompiler()

// ── Helpers ───────────────────────────────────────────────────────────────────

// Axon codegen wraps the module body in a bare block `{ ... }`, so top-level
// fns are block-scoped consts, invisible from outside. Inject an assignment to
// globalThis just before the final closing brace to expose the named symbols.
function transpileAndExpose(source, names) {
  const js = harness.transpile(source, compiler)
  const lastBrace = js.lastIndexOf('}')
  if (lastBrace < 0) throw new Error('unexpected codegen output: no closing brace')
  const exportLine = `\n  globalThis.__axonExports = { ${names.join(', ')} };\n`
  return js.slice(0, lastBrace) + exportLine + js.slice(lastBrace)
}

function loadAxonFns(source, names) {
  const js = transpileAndExpose(source, names)
  const { ctx } = harness.runInVm(js)
  if (!ctx.__axonExports) throw new Error('exports not found in vm context')
  return ctx.__axonExports
}

function fmtMs(ms) {
  return ms >= 1 ? ms.toFixed(2) + ' ms' : (ms * 1000).toFixed(1) + ' µs'
}

const findings = []

console.log('═══ Track C: runtime performance of generated JS ═══\n')

// ══ 1. Dungeon generator head-to-head ════════════════════════════════════════

console.log('── 1. Dungeon generator: Axon-generated vs hand-written JS ──')

const generatorSrc = fs.readFileSync(path.join(REPO, 'examples', 'dungeon', 'generator.axn'), 'utf8')
// generator.axn imports tile constructors from ./tiles but only uses string
// tags internally, and Axon codegen skips import statements (they are resolved
// by the CLI bundler). Single-file transpile is therefore self-contained; the
// vm run below (including its @test blocks) confirms it.
const axonGen = loadAxonFns(generatorSrc, ['generate', 'count_tag'])

// Sanity: run the module's own @test suite in the vm.
{
  const js = transpileAndExpose(generatorSrc, ['generate'])
  const { testResult } = harness.runInVm(js)
  if (testResult && testResult.failed > 0) {
    throw new Error('generator.axn @test suite failed inside vm: ' + JSON.stringify(testResult.results))
  }
  console.log(`Axon @test suite in vm: ${testResult.passed}/${testResult.total} passed`)
}

// Output-equality check across a spread of seeds, sizes, and levels.
const equalityCases = []
for (const [rows, cols] of [[10, 20], [22, 48], [8, 12], [30, 60], [15, 15]]) {
  for (const level of [1, 5, 10]) {
    for (const seed of [42, 7777, 99, 123456789, 0, 2147483647]) {
      equalityCases.push([rows, cols, level, seed])
    }
  }
}
let mismatches = 0
for (const [rows, cols, level, seed] of equalityCases) {
  const a = axonGen.generate(rows, cols, level, seed)
  const b = handwritten.generate(rows, cols, level, seed)
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    mismatches++
    if (mismatches === 1) {
      console.log(`MISMATCH at rows=${rows} cols=${cols} level=${level} seed=${seed}`)
    }
  }
}
const seedsVerifiedEqual = mismatches === 0
console.log(`Output equality: ${equalityCases.length - mismatches}/${equalityCases.length} cases identical (deep-equal via JSON)`)

// Benchmark: a batch of `batchSize` map generations with varying seeds.
// 22x48 is the size the repo's own demo uses. Batch tuned so a run is >10ms.
const batchSize = 200
function makeBatch(genFn) {
  return () => {
    let sink = 0
    for (let i = 0; i < batchSize; i++) {
      const m = genFn(22, 48, 1 + (i % 10), 1000 + i * 37)
      sink += m.grid.length
    }
    return sink
  }
}
// Guard against dead-code elimination and confirm both produce same work.
if (makeBatch(axonGen.generate)() !== makeBatch(handwritten.generate)()) {
  console.log('WARNING: batch checksums differ between implementations')
}

const axonStats = harness.bench(makeBatch(axonGen.generate), { iterations: 30, warmup: 5, label: 'axon' })
const handStats = harness.bench(makeBatch(handwritten.generate), { iterations: 30, warmup: 5, label: 'handwritten' })
const overheadRatio = axonStats.median / handStats.median

console.log(`Axon-generated: median ${fmtMs(axonStats.median)} / batch of ${batchSize} maps (min ${fmtMs(axonStats.min)}, p95 ${fmtMs(axonStats.p95)})`)
console.log(`Hand-written:   median ${fmtMs(handStats.median)} / batch of ${batchSize} maps (min ${fmtMs(handStats.min)}, p95 ${fmtMs(handStats.p95)})`)
console.log(`Overhead ratio (axon / handwritten): ${overheadRatio.toFixed(3)}x\n`)

findings.push(
  `Dungeon generator: Axon-generated JS runs at ${overheadRatio.toFixed(2)}x the time of hand-written JS ` +
  `(outputs ${seedsVerifiedEqual ? 'verified identical across ' + equalityCases.length + ' seed/size/level cases' : 'NOT identical — see note'}).`
)

// ══ 2a. where-constraint guard overhead ══════════════════════════════════════

console.log('── 2a. where-constraint guard overhead ──')

const whereSrc = [
  'type Pos = int where value >= 0',
  'fn add_guarded(a: Pos, b: Pos) -> int { a + b }',
  'fn add_plain(a: int, b: int) -> int { a + b }',
  '',
].join('\n')
const whereFns = loadAxonFns(whereSrc, ['add_guarded', 'add_plain'])

// Sanity: guard actually rejects invalid input.
let guardRejects = false
try {
  whereFns.add_guarded(-1, 2)
} catch (e) {
  guardRejects = /AxonConstraintError/.test(String(e))
}
if (whereFns.add_guarded(3, 4) !== 7 || whereFns.add_plain(3, 4) !== 7) {
  throw new Error('where-guard functions returned wrong results')
}
console.log(`Guard rejects invalid input (add_guarded(-1, 2) throws AxonConstraintError): ${guardRejects}`)

// At single-digit ns/call the harness's one-closure-call-per-op indirection
// would swamp the guard cost, so each benchThroughput op is a batch of
// CALLS_PER_OP direct calls; nsPerOp/CALLS_PER_OP gives ns per call. The two
// variants are built from identical wrapper code and measured in alternating
// rounds (median taken) so JIT warm-up order can't bias one side.
const CALLS_PER_OP = 10_000
const BATCH_OPS = 300
function makeCallBatch(fn) {
  return () => {
    let s = 0
    for (let i = 0; i < CALLS_PER_OP; i++) s += fn(i & 0xffff, 3)
    return s
  }
}
const guardedBatch = makeCallBatch(whereFns.add_guarded)
const plainBatch = makeCallBatch(whereFns.add_plain)
const guardedSamples = []
const plainSamples = []
for (let round = 0; round < 7; round++) {
  guardedSamples.push(harness.benchThroughput(guardedBatch, { ops: BATCH_OPS, warmup: 30 }).nsPerOp / CALLS_PER_OP)
  plainSamples.push(harness.benchThroughput(plainBatch, { ops: BATCH_OPS, warmup: 30 }).nsPerOp / CALLS_PER_OP)
}
const guardedRes = { nsPerOp: harness.summarize(guardedSamples).median, opsPerSec: 0 }
const plainRes = { nsPerOp: harness.summarize(plainSamples).median, opsPerSec: 0 }
guardedRes.opsPerSec = 1e9 / guardedRes.nsPerOp
plainRes.opsPerSec = 1e9 / plainRes.nsPerOp
const guardOverheadPct = ((guardedRes.nsPerOp - plainRes.nsPerOp) / plainRes.nsPerOp) * 100

console.log(`With guard:    ${guardedRes.nsPerOp.toFixed(2)} ns/call (${(guardedRes.opsPerSec / 1e6).toFixed(1)}M calls/s)`)
console.log(`Without guard: ${plainRes.nsPerOp.toFixed(2)} ns/call (${(plainRes.opsPerSec / 1e6).toFixed(1)}M calls/s)`)
console.log(`Guard overhead: +${(guardedRes.nsPerOp - plainRes.nsPerOp).toFixed(2)} ns/call (${guardOverheadPct.toFixed(0)}%)\n`)

findings.push(
  `where-guard: constraint validation adds ~${(guardedRes.nsPerOp - plainRes.nsPerOp).toFixed(1)} ns per call ` +
  `(${guardOverheadPct.toFixed(0)}% on a trivial add; two guarded params). Guard correctly throws on violation: ${guardRejects}.`
)

// ══ 2b. @memo ═════════════════════════════════════════════════════════════════

console.log('── 2b. @memo caching ──')

// Non-recursive expensive pure fn so "first call" genuinely does the work.
const memoSrc = [
  '@memo',
  'fn heavy(n: int) -> float {',
  '  let mut acc = 0.0',
  '  for i in 0..n { acc = acc + Math.sqrt(i * 1.0) }',
  '  acc',
  '}',
  'fn heavy_plain(n: int) -> float {',
  '  let mut acc = 0.0',
  '  for i in 0..n { acc = acc + Math.sqrt(i * 1.0) }',
  '  acc',
  '}',
  '',
].join('\n')
const memoFns = loadAxonFns(memoSrc, ['heavy', 'heavy_plain'])

const MEMO_N = 5_000_000
const t0 = harness.nowNs()
const firstVal = memoFns.heavy(MEMO_N)
const firstCallMs = harness.nsToMs(harness.nowNs() - t0)

// Median of repeated cached calls (individually far below timer noise for one shot).
const cachedSamples = []
for (let i = 0; i < 20; i++) {
  const t = harness.nowNs()
  const v = memoFns.heavy(MEMO_N)
  cachedSamples.push(harness.nsToMs(harness.nowNs() - t))
  if (v !== firstVal) throw new Error('@memo returned a different value on cached call')
}
const cachedCallMs = harness.summarize(cachedSamples).median

const plainStats = harness.bench(() => memoFns.heavy_plain(MEMO_N), { iterations: 10, warmup: 2 })
if (memoFns.heavy_plain(MEMO_N) !== firstVal) throw new Error('plain fn disagrees with memoized fn')

const memoized = cachedCallMs < firstCallMs / 100 && cachedCallMs < plainStats.median / 100
const speedup = cachedCallMs > 0 ? firstCallMs / cachedCallMs : Infinity

console.log(`First call  heavy(${MEMO_N.toLocaleString()}): ${fmtMs(firstCallMs)}`)
console.log(`Cached call (same arg, median of 20): ${fmtMs(cachedCallMs)}`)
console.log(`Same fn without @memo (median): ${fmtMs(plainStats.median)} per call`)
console.log(`Memoization real: ${memoized} — cached-call speedup ${speedup >= 1000 ? Math.round(speedup).toLocaleString() : speedup.toFixed(1)}x vs first call\n`)

findings.push(
  `@memo: caching is ${memoized ? 'real' : 'NOT effective'} — repeat call with same arg took ${fmtMs(cachedCallMs)} ` +
  `vs ${fmtMs(firstCallMs)} cold (${Math.round(speedup).toLocaleString()}x). Cache key is JSON.stringify of args, so keying costs scale with arg size.`
)

// ══ 3. Code size: controls.axn vs controls.ts ════════════════════════════════

console.log('── 3. Code size: controls.axn vs controls.ts ──')

const axonCtrlSrc = fs.readFileSync(path.join(REPO, 'examples', 'controls.axn'), 'utf8')
const tsCtrlSrc = fs.readFileSync(path.join(REPO, 'examples', 'controls.ts'), 'utf8')
const axonCtrlJs = harness.transpile(axonCtrlSrc, compiler)

const countLines = (s) => s.split('\n').filter((l) => l.trim().length > 0).length

const axonSrcLines = countLines(axonCtrlSrc)
const axonJsLines = countLines(axonCtrlJs)
const axonJsBytes = Buffer.byteLength(axonCtrlJs, 'utf8')
const tsSrcLines = countLines(tsCtrlSrc)

// The generated file = fixed stdlib/test-runner prelude + module body.
// Measure the prelude so the per-module marginal cost is visible too.
const bodyStart = axonCtrlJs.lastIndexOf('\n{\n')
const preludeLines = bodyStart >= 0 ? countLines(axonCtrlJs.slice(0, bodyStart)) : 0

// tsc emit for the TS twin (tsconfig is ignored when files are passed on CLI).
let tsJsLines = null
let tsJsBytes = null
let tscNote = ''
const tscOut = fs.mkdtempSync(path.join(os.tmpdir(), 'axon-bench-tsc-'))
try {
  try {
    execFileSync('npx', ['tsc', '--target', 'es2020', '--module', 'commonjs', '--outDir', tscOut, path.join(REPO, 'examples', 'controls.ts')], { cwd: REPO, stdio: 'pipe' })
  } catch (e) {
    // tsc exits non-zero on type errors but still emits JS by default.
    tscNote = 'tsc reported diagnostics but emitted JS. '
  }
  const emitted = path.join(tscOut, 'controls.js')
  if (fs.existsSync(emitted)) {
    const tsJs = fs.readFileSync(emitted, 'utf8')
    tsJsLines = countLines(tsJs)
    tsJsBytes = Buffer.byteLength(tsJs, 'utf8')
  } else {
    tscNote += 'tsc did not emit output; comparing sources only.'
  }
} finally {
  fs.rmSync(tscOut, { recursive: true, force: true })
}

console.log(`Axon source:        ${axonSrcLines} non-empty lines (${Buffer.byteLength(axonCtrlSrc)} bytes)`)
console.log(`Axon generated JS:  ${axonJsLines} non-empty lines, ${axonJsBytes} bytes (${preludeLines} of those lines are the fixed stdlib/test prelude)`)
console.log(`TS source:          ${tsSrcLines} non-empty lines (${Buffer.byteLength(tsCtrlSrc)} bytes)`)
console.log(`tsc-emitted JS:     ${tsJsLines ?? 'n/a'} non-empty lines, ${tsJsBytes ?? 'n/a'} bytes ${tscNote}`)
console.log(`Source ratio (axon/ts): ${(axonSrcLines / tsSrcLines).toFixed(2)}x`)
if (tsJsLines) console.log(`Emitted-JS ratio (axon/tsc): ${(axonJsLines / tsJsLines).toFixed(2)}x lines, ${(axonJsBytes / tsJsBytes).toFixed(2)}x bytes`)
console.log()

findings.push(
  `Code size: controls.axn is ${axonSrcLines} src lines vs ${tsSrcLines} for the TS twin (${(axonSrcLines / tsSrcLines).toFixed(2)}x). ` +
  `Axon's generated JS is ${axonJsLines} lines / ${axonJsBytes} bytes` +
  (tsJsLines ? ` vs tsc's ${tsJsLines} lines / ${tsJsBytes} bytes (${(axonJsBytes / tsJsBytes).toFixed(1)}x bytes)` : '') +
  `; ${preludeLines} lines of that is a fixed per-file stdlib/test-runner prelude.`
)

// ══ Write results ═════════════════════════════════════════════════════════════

const result = {
  dungeon: {
    seedsVerifiedEqual,
    equalityCases: equalityCases.length,
    batchSize,
    mapSize: '22x48',
    axonMedianMs: axonStats.median,
    handwrittenMedianMs: handStats.median,
    overheadRatio,
    axonStats,
    handwrittenStats: handStats,
    note: seedsVerifiedEqual
      ? `Outputs byte-identical (JSON deep-equal) across ${equalityCases.length} seed/size/level combinations before timing. Hand-written port inlines grid indexing and uses function declarations; algorithm and LCG identical.`
      : `${mismatches}/${equalityCases.length} cases mismatched — timings are best-effort, see console output.`,
  },
  whereGuard: {
    withGuardNsPerOp: guardedRes.nsPerOp,
    withoutGuardNsPerOp: plainRes.nsPerOp,
    overheadPct: guardOverheadPct,
    guardRejectsInvalidInput: guardRejects,
    callsMeasured: CALLS_PER_OP * BATCH_OPS * 7,
    note: 'Two constrained params (type Pos = int where value >= 0) on a trivial add. Measured as median of 7 alternating rounds of 3M direct calls each. Guard = one predicate call + branch per constrained param; overhead % is worst-case since the fn body is a single add.',
  },
  memo: {
    memoized,
    firstCallMs,
    cachedCallMs,
    speedup,
    plainMedianMs: plainStats.median,
    vsNoMemoNote: `Same body without @memo takes ${plainStats.median.toFixed(2)} ms per call every time; @memo pays ${firstCallMs.toFixed(2)} ms once then ~${(cachedCallMs * 1000).toFixed(1)} µs per repeat call. Cache is a Map keyed by JSON.stringify(args), unbounded.`,
  },
  codeSize: {
    axonSrcLines,
    axonJsLines,
    axonJsBytes,
    axonJsPreludeLines: preludeLines,
    tsSrcLines,
    tsJsLines,
    tsJsBytes,
    note: `Non-empty lines. Axon generated JS carries a fixed stdlib + test-runner prelude (~${preludeLines} lines) in every emitted file plus JSDoc for each fn. ${tscNote}`.trim(),
  },
  findings,
}

const file = harness.writeResult('track-c-runtime-perf', result)
console.log('═══ Findings ═══')
for (const f of findings) console.log('• ' + f)
console.log(`\nResults written to ${file}`)
