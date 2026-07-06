'use strict'

// Entry point for the full Axon benchmark suite.
// Runs every track in sequence, then prints where the JSON results landed.
// Each track script is self-contained and writes benchmark/results/<track>.json.

const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const ROOT = __dirname

const TRACKS = [
  ['Track A — Correctness', 'track-a-correctness/run.js'],
  ['Track B — Compiler performance', 'track-b-compiler-perf/run.js'],
  ['Track C — Runtime performance', 'track-c-runtime-perf/run.js'],
  ['Track D — AI-native writability', 'track-d-ai-native/run.js'],
]

// Rebuild dist/ from src/ so tracks that transpile (B, C, D compiled-token
// metric) always run against the current compiler. Skippable with
// BENCH_SKIP_BUILD=1 for fast iteration when dist/ is known-fresh.
function ensureBuilt() {
  const repoRoot = path.join(ROOT, '..')
  const cli = path.join(repoRoot, 'dist', 'cli.js')

  if (process.env.BENCH_SKIP_BUILD === '1') {
    if (!fs.existsSync(cli)) {
      console.error('\n  BENCH_SKIP_BUILD=1 but dist/cli.js is missing. Run `npx tsc` first.\n')
      process.exit(1)
    }
    console.log('  [build] skipped (BENCH_SKIP_BUILD=1) — using existing dist/')
    return
  }

  console.log('  [build] rebuilding compiler (npx tsc) so results reflect current src/ ...')
  try {
    execFileSync('npx', ['tsc'], { stdio: 'inherit', cwd: repoRoot, env: process.env })
  } catch {
    console.error('\n  Compiler build failed (npx tsc). Fix TypeScript errors before benchmarking.\n')
    process.exit(1)
  }
  if (!fs.existsSync(cli)) {
    console.error('\n  Build finished but dist/cli.js is missing — check tsconfig outDir.\n')
    process.exit(1)
  }
}

function main() {
  ensureBuilt()
  const started = Date.now()
  const summary = []

  for (const [label, rel] of TRACKS) {
    const script = path.join(ROOT, rel)
    if (!fs.existsSync(script)) {
      console.warn(`\n  [skip] ${label} — ${rel} not found`)
      summary.push([label, 'skipped'])
      continue
    }
    console.log(`\n${'='.repeat(64)}\n  ${label}\n${'='.repeat(64)}`)
    try {
      const args = [script]
      if (rel === 'track-d-ai-native/run.js' && process.env.BENCH_TRACK_D_LIVE === '1') {
        args.push('--live')
      }
      execFileSync('node', args, { stdio: 'inherit', cwd: ROOT, env: process.env })
      summary.push([label, 'ok'])
    } catch (e) {
      summary.push([label, 'FAILED'])
      console.error(`  ${label} exited non-zero (see output above).`)
    }
  }

  const secs = ((Date.now() - started) / 1000).toFixed(1)
  console.log(`\n${'='.repeat(64)}\n  Suite complete in ${secs}s\n${'='.repeat(64)}`)
  for (const [label, status] of summary) {
    console.log(`  ${status === 'ok' ? '✓' : status === 'skipped' ? '·' : '✗'} ${label} — ${status}`)
  }
  console.log(`\n  Results written to benchmark/results/*.json`)
  console.log(`  Report: node benchmark/report/run.js\n`)

  // Synthesize markdown verdict from track JSON outputs.
  const reportScript = path.join(ROOT, 'report', 'run.js')
  if (fs.existsSync(reportScript)) {
    console.log(`${'='.repeat(64)}\n  Report\n${'='.repeat(64)}`)
    try {
      execFileSync('node', [reportScript], { stdio: 'inherit', cwd: ROOT })
    } catch {
      console.error('  Report step failed (track JSON may be incomplete).')
    }
  }
}

main()
