'use strict'

// Track D entry point: static token economy (always) + harness sanity + optional live sessions.

const path = require('path')
const harness = require('../lib/harness.js')
const { loadTasks, scoreReferenceSolution, testsPassed } = require('./lib/harness-common.js')
const { main: runStatic } = require('./run-static.js')
const { main: runLive } = require('./run-live.js')

const REPO = path.join(__dirname, '..', '..')

function runHarnessSanity() {
  console.log('── Harness sanity (reference solutions, hidden answer keys) ──\n')
  const tasks = loadTasks()
  const results = []
  const findings = []

  for (const task of tasks) {
    const scored = scoreReferenceSolution(task.id)
    const axonOk = scored.axon.compiled && testsPassed(scored.axon)
    const tsOk = scored.typescript.compiled && testsPassed(scored.typescript)
    console.log(
      `  ${task.id}: axon ${axonOk ? 'OK' : 'FAIL'} (${scored.axon.tests?.passed}/${scored.axon.tests?.total}), ` +
        `ts ${tsOk ? 'OK' : 'FAIL'} (${scored.typescript.tests?.passed}/${scored.typescript.tests?.total})`
    )
    if (!axonOk) findings.push(`Reference axon/${task.id}.axn failed harness sanity`)
    if (!tsOk) findings.push(`Reference ts/${task.id}.ts failed harness sanity`)
    results.push({ id: task.id, spec: task.spec, ...scored, harnessOk: axonOk && tsOk })
  }

  const allOk = results.every((r) => r.harnessOk)
  if (allOk) findings.unshift('All reference solutions pass acceptance tests — harness is valid.')
  else findings.unshift('Some reference solutions failed — fix harness before trusting live results.')

  return { allOk, results, findings }
}

function main() {
  const live = process.argv.includes('--live') || process.env.BENCH_TRACK_D_LIVE === '1'

  console.log('Track D: AI-native writability + token/cost\n')

  console.log('═══ D-static: token economy ═══\n')
  const staticResult = runStatic()

  console.log('\n═══ Harness sanity ═══\n')
  const sanity = runHarnessSanity()

  let liveResult = null
  if (live) {
    console.log('\n═══ D-live: AI sessions ═══\n')
    liveResult = runLive()
    harness.writeResult('track-d-live', liveResult)
  } else {
    console.log('\n  (Skipping D-live — pass --live or set BENCH_TRACK_D_LIVE=1)\n')
    liveResult = { status: 'not_run', note: 'Run with --live after populating live-sessions/' }
  }

  const findings = [
    ...staticResult.findings,
    ...sanity.findings,
    ...(liveResult.findings || []),
  ]

  const payload = {
    static: staticResult,
    harnessSanity: sanity,
    live: liveResult,
    findings,
    summary: {
      staticAggregate: staticResult.aggregate,
      harnessSanityOk: sanity.allOk,
      liveStatus: liveResult.status,
      liveSummary: liveResult.summary || null,
    },
  }

  const file = harness.writeResult('track-d-ai-native', payload)
  console.log('── Track D summary ──')
  console.log(`  Token output ratio (axon/ts): ${staticResult.aggregate.ratios.outputTokens.toFixed(2)}×`)
  console.log(`  Token logic ratio (axon/ts):  ${staticResult.aggregate.ratios.logicTokens.toFixed(2)}×`)
  console.log(`  Harness sanity: ${sanity.allOk ? 'OK' : 'FAILED'}`)
  console.log(`  Live sessions:  ${liveResult.status}`)
  console.log(`\nResults written to ${path.relative(REPO, file)}`)
}

main()
