'use strict'

// Track D-static: token economy comparison (Axon vs TypeScript).
// Always runs in CI; does not require live agent sessions.

const fs = require('fs')
const path = require('path')
const harness = require('../lib/harness.js')
const tokens = require('../lib/tokens.js')
const { loadTasks, SOLUTIONS, REPO } = require('./lib/harness-common.js')

function readPair(taskId) {
  return {
    axon: fs.readFileSync(path.join(SOLUTIONS, `${taskId}.axn`), 'utf8'),
    ts: fs.readFileSync(path.join(SOLUTIONS, `${taskId}.ts`), 'utf8'),
  }
}

// Transpile Axon source to JS so we can measure compiled-output tokens — the
// artifact codegen changes actually affect. Returns null if the build is
// unavailable or the source fails to compile (metric is simply omitted then).
let _compiler = null
let _compileWarned = false
function compileAxon(source) {
  try {
    if (!_compiler) _compiler = harness.loadCompiler()
    return harness.transpile(source, _compiler)
  } catch (err) {
    if (!_compileWarned) {
      _compileWarned = true
      console.warn(
        `  [warn] compiled-output tokens unavailable: ${err.message.split('\n')[0]}`
      )
      console.warn('  [warn] ensure dist/ is built and demo/axon.stdlib.js exists (see benchmark/Dockerfile)')
    }
    return null
  }
}

function main() {
  console.log('Track D-static: token economy\n')

  const tasks = loadTasks()
  const pairs = []

  for (const task of tasks) {
    const { axon, ts } = readPair(task.id)
    const analysis = tokens.analyzeSourcePair({
      taskId: task.id,
      axonSource: axon,
      tsSource: ts,
      taskSpec: task.spec,
      repoRoot: REPO,
      axonCompiled: compileAxon(axon),
    })
    pairs.push(analysis)
    const compiled =
      analysis.ratios.compiledTokens != null
        ? `, compiled ${analysis.ratios.compiledTokens.toFixed(2)}×`
        : ''
    console.log(
      `  ${task.id}: output ${analysis.ratios.outputTokens.toFixed(2)}×, ` +
        `logic ${analysis.ratios.logicTokens.toFixed(2)}×, ` +
        `prompt ${analysis.ratios.promptTokens.toFixed(2)}×${compiled}`
    )
  }

  // Repo-scale example: controls.axn vs controls.ts
  const controlsAxon = fs.readFileSync(path.join(REPO, 'examples/controls.axn'), 'utf8')
  const controlsTs = fs.readFileSync(path.join(REPO, 'examples/controls.ts'), 'utf8')
  const controlsSpec =
    'Web UI controls demo: counter, email validator, toggle, theme switcher, modal — pure state transition functions.'
  const controls = tokens.analyzeSourcePair({
    taskId: 'controls',
    axonSource: controlsAxon,
    tsSource: controlsTs,
    taskSpec: controlsSpec,
    repoRoot: REPO,
    axonCompiled: compileAxon(controlsAxon),
  })
  pairs.push(controls)
  console.log(
    `  controls: output ${controls.ratios.outputTokens.toFixed(2)}×, ` +
      `logic ${controls.ratios.logicTokens.toFixed(2)}×, ` +
      `prompt ${controls.ratios.promptTokens.toFixed(2)}×`
  )

  const aggregate = tokens.summarizeTokenPairs(pairs.filter((p) => p.taskId !== 'controls'))
  const taskOnly = pairs.filter((p) => p.taskId !== 'controls')

  const findings = [
    `Across ${taskOnly.length} benchmark tasks, Axon full output is ${aggregate.ratios.outputTokens.toFixed(2)}× TypeScript tokens (metadata + @test inflate Axon).`,
    `Logic-only (annotations/comments stripped): ${aggregate.ratios.logicTokens.toFixed(2)}× — closer measure of syntax efficiency.`,
    `Simulated generation prompt (spec + README for Axon): ${aggregate.ratios.promptTokens.toFixed(2)}× input tokens before any output.`,
    `controls.axn example: ${controls.ratios.outputTokens.toFixed(2)}× output, ${controls.ratios.logicTokens.toFixed(2)}× logic vs controls.ts.`,
  ]

  if (aggregate.ratios.compiledTokens != null) {
    findings.push(
      `Compiled JS output (transpiled Axon vs TS source): ${aggregate.ratios.compiledTokens.toFixed(2)}× — this is the metric codegen changes move.`
    )
  } else {
    findings.push(
      'Compiled-output tokens unavailable — build dist/ (`npx tsc`) so codegen changes are measured.'
    )
  }

  console.log('\n── Aggregate (6 tasks) ──')
  console.log(`  Output token ratio (axon/ts): ${aggregate.ratios.outputTokens.toFixed(2)}×`)
  console.log(`  Logic token ratio (axon/ts):  ${aggregate.ratios.logicTokens.toFixed(2)}×`)
  console.log(`  Prompt token ratio (axon/ts): ${aggregate.ratios.promptTokens.toFixed(2)}×`)
  if (aggregate.ratios.compiledTokens != null) {
    console.log(`  Compiled JS ratio (axon/ts):  ${aggregate.ratios.compiledTokens.toFixed(2)}×`)
  }

  return {
    pairs,
    aggregate,
    controls,
    findings,
    note: tokens.loadPricing().note || 'cl100k_base proxy via js-tiktoken',
  }
}

if (require.main === module) {
  const result = main()
  const file = harness.writeResult('track-d-static', result)
  console.log(`\nResults written to ${path.relative(REPO, file)}`)
}

module.exports = { main }
