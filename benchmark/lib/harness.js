'use strict'

// Shared benchmark harness: timing, statistics, and result IO.
// Used by every track so numbers are produced and reported consistently.

const fs = require('fs')
const path = require('path')

const RESULTS_DIR = path.join(__dirname, '..', 'results')

function ensureResultsDir() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true })
}

function nowNs() {
  return process.hrtime.bigint()
}

// Convert a bigint nanosecond delta to milliseconds (float).
function nsToMs(ns) {
  return Number(ns) / 1e6
}

function median(sorted) {
  const n = sorted.length
  if (n === 0) return 0
  const mid = Math.floor(n / 2)
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

function summarize(samplesMs) {
  const sorted = [...samplesMs].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  return {
    samples: sorted.length,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    mean: sorted.length ? sum / sorted.length : 0,
    median: median(sorted),
    p95: percentile(sorted, 95),
  }
}

// Time `fn` repeatedly. Returns a stats summary in milliseconds.
// opts: { iterations, warmup, label }
function bench(fn, opts = {}) {
  const iterations = opts.iterations ?? 50
  const warmup = opts.warmup ?? Math.min(5, iterations)

  for (let i = 0; i < warmup; i++) fn()

  const samples = []
  for (let i = 0; i < iterations; i++) {
    const start = nowNs()
    fn()
    samples.push(nsToMs(nowNs() - start))
  }
  const stats = summarize(samples)
  if (opts.label) stats.label = opts.label
  return stats
}

// Run `fn` a fixed number of times and report total + per-op throughput.
// Useful for ops that are individually too fast to time reliably.
function benchThroughput(fn, opts = {}) {
  const ops = opts.ops ?? 100000
  const warmup = opts.warmup ?? Math.min(1000, Math.floor(ops / 10))

  for (let i = 0; i < warmup; i++) fn()

  const start = nowNs()
  for (let i = 0; i < ops; i++) fn()
  const totalMs = nsToMs(nowNs() - start)
  return {
    ops,
    totalMs,
    opsPerSec: ops / (totalMs / 1000),
    nsPerOp: (totalMs * 1e6) / ops,
    label: opts.label,
  }
}

function writeResult(name, data) {
  ensureResultsDir()
  const file = path.join(RESULTS_DIR, `${name}.json`)
  const payload = {
    track: name,
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    ...data,
  }
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  return file
}

function readResult(name) {
  const file = path.join(RESULTS_DIR, `${name}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

// ── Axon compiler access ──────────────────────────────────────────────────────
// Load the built compiler stages from dist/. Throws a clear message if the
// project has not been built yet.

function loadCompiler() {
  const distDir = path.join(__dirname, '..', '..', 'dist')
  if (!fs.existsSync(path.join(distDir, 'cli.js'))) {
    throw new Error('Compiler not built. Run `npm ci && npx tsc` at the repo root first.')
  }
  const { Lexer } = require(path.join(distDir, 'lexer.js'))
  const { Parser } = require(path.join(distDir, 'parser.js'))
  const { Checker } = require(path.join(distDir, 'checker.js'))
  const { Codegen } = require(path.join(distDir, 'codegen.js'))
  return { Lexer, Parser, Checker, Codegen }
}

// Full transpile of a single source string. Returns generated JS.
// Throws on parse errors (mirrors cli.ts behavior).
function transpile(source, compiler = loadCompiler()) {
  const { Lexer, Parser, Checker, Codegen } = compiler
  const tokens = new Lexer(source).tokenize()
  const { ast, errors } = new Parser(tokens).parse()
  if (errors && errors.length > 0) {
    throw new Error('Parse errors:\n' + errors.map((e) => '  ' + e.message).join('\n'))
  }
  new Checker().check(ast)
  return new Codegen().generate(ast)
}

// Cached stdlib source. As of v0.9.8 the @test harness globals
// (__axon_tests / __runAxonTests) live in AXON_STDLIB, so the vm context must
// have the stdlib injected before running generated code — same as cli.ts.
let _stdlib = null
function loadStdlib() {
  if (_stdlib != null) return _stdlib
  const distDir = path.join(__dirname, '..', '..', 'dist')
  try {
    _stdlib = require(path.join(distDir, 'stdlib.js')).AXON_STDLIB || ''
  } catch {
    _stdlib = ''
  }
  return _stdlib
}

// Run generated JS in an isolated vm context and return the exported test
// harness result (if the program declared @test blocks), mirroring cli.ts:
// inject the stdlib (which defines the @test runner) then run the user code
// wrapped in a block so top-level declarations don't leak between programs.
function runInVm(js) {
  const vm = require('vm')
  const ctx = {
    console,
    process,
    Math,
    JSON,
    Array,
    Object,
    Map,
    Set,
    String,
    Number,
    Boolean,
    setTimeout,
    Promise,
  }
  vm.createContext(ctx)
  const stdlib = loadStdlib()
  if (stdlib) vm.runInContext(stdlib, ctx)
  vm.runInContext('{\n' + js + '\n}', ctx)
  return {
    ctx,
    testResult: ctx.__runAxonTests ? ctx.__runAxonTests() : null,
  }
}

module.exports = {
  RESULTS_DIR,
  ensureResultsDir,
  nowNs,
  nsToMs,
  summarize,
  bench,
  benchThroughput,
  writeResult,
  readResult,
  loadCompiler,
  loadStdlib,
  transpile,
  runInVm,
}
