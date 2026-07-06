'use strict'

// Track D-live: evaluate AI generation sessions (tokens + compile/test + fix loops).
// Reads session transcripts from live-sessions/*.json (written by agent runs).
// Generates prompts to live-prompts/ when sessions are missing.

const fs = require('fs')
const path = require('path')
const harness = require('../lib/harness.js')
const tokens = require('../lib/tokens.js')
const {
  REPO,
  loadTasks,
  evaluateAxonSource,
  evaluateTypeScriptSource,
  buildFixPrompt,
  testsPassed,
} = require('./lib/harness-common.js')

const LIVE_DIR = path.join(__dirname, 'live-sessions')
const PROMPTS_DIR = path.join(__dirname, 'live-prompts')

function extractSourceFromAssistant(content, language) {
  if (!content) return ''
  const fence = content.match(/```(?:axon|axn|typescript|ts)?\s*\n([\s\S]*?)```/)
  if (fence) return fence[1].trim()
  return content.trim()
}

function evaluateSession(task, language, turns) {
  const assistantTurns = turns.filter((t) => t.role === 'assistant')
  const tokenAnalysis = tokens.analyzeSessionTurns(turns)

  let firstAttemptCompiled = false
  let firstAttemptTestsPassed = false
  let fixIterations = null
  let finalEval = null
  const attemptLog = []

  for (let i = 0; i < assistantTurns.length; i++) {
    const source = extractSourceFromAssistant(assistantTurns[i].content, language)
    const evalResult =
      language === 'axon'
        ? evaluateAxonSource(task.id, source)
        : evaluateTypeScriptSource(task.id, source)

    attemptLog.push({
      attempt: i + 1,
      compiled: evalResult.compiled,
      testsPassed: testsPassed(evalResult),
      outputTokens: tokens.countTokens(assistantTurns[i].content),
      compileError: evalResult.compileError,
      tests: evalResult.tests,
    })

    if (i === 0) {
      firstAttemptCompiled = evalResult.compiled
      firstAttemptTestsPassed = testsPassed(evalResult)
    }

    if (testsPassed(evalResult)) {
      fixIterations = i
      finalEval = evalResult
      break
    }
    finalEval = evalResult
  }

  if (fixIterations === null) fixIterations = assistantTurns.length > 0 ? assistantTurns.length - 1 : 0

  return {
    taskId: task.id,
    language,
    firstAttemptCompiled,
    firstAttemptTestsPassed,
    fixIterations,
    attempts: assistantTurns.length,
    finalTestsPassed: testsPassed(finalEval),
    sessionInputTokens: tokenAnalysis.sessionInputTokens,
    sessionOutputTokens: tokenAnalysis.sessionOutputTokens,
    sessionCostUsd: tokenAnalysis.sessionCostUsd,
    attemptLog,
  }
}

function sessionPath(taskId, language) {
  return path.join(LIVE_DIR, `${taskId}_${language}.json`)
}

function loadSession(taskId, language) {
  const file = sessionPath(taskId, language)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writePrompts(tasks) {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true })
  const written = []
  for (const task of tasks) {
    for (const language of ['axon', 'typescript']) {
      const prompt =
        language === 'axon'
          ? tokens.buildSimulatedPrompt(task.spec, 'axon', REPO)
          : tokens.buildSimulatedPrompt(task.spec, 'typescript', REPO)
      const file = path.join(PROMPTS_DIR, `${task.id}_${language}.txt`)
      fs.writeFileSync(file, prompt, 'utf8')
      written.push(path.relative(REPO, file))
    }
  }
  return written
}

function summarizeSessions(sessions) {
  const byLang = (lang) => sessions.filter((s) => s.language === lang)
  const axon = byLang('axon')
  const ts = byLang('typescript')

  const avg = (arr, field) => (arr.length ? arr.reduce((a, s) => a + s[field], 0) / arr.length : 0)
  const rate = (arr, field) => (arr.length ? arr.filter((s) => s[field]).length / arr.length : 0)

  return {
    sessionCount: sessions.length,
    axon: {
      sessions: axon.length,
      firstAttemptPassRate: rate(axon, 'firstAttemptTestsPassed'),
      avgFixIterations: avg(axon, 'fixIterations'),
      avgSessionOutputTokens: avg(axon, 'sessionOutputTokens'),
      avgSessionCostUsd: avg(axon, 'sessionCostUsd'),
      totalSessionCostUsd: axon.reduce((a, s) => a + s.sessionCostUsd, 0),
    },
    typescript: {
      sessions: ts.length,
      firstAttemptPassRate: rate(ts, 'firstAttemptTestsPassed'),
      avgFixIterations: avg(ts, 'fixIterations'),
      avgSessionOutputTokens: avg(ts, 'sessionOutputTokens'),
      avgSessionCostUsd: avg(ts, 'sessionCostUsd'),
      totalSessionCostUsd: ts.reduce((a, s) => a + s.sessionCostUsd, 0),
    },
  }
}

function main(opts = {}) {
  const generateOnly = opts.generatePromptsOnly || process.argv.includes('--generate-prompts')
  console.log('Track D-live: AI session evaluation\n')

  const tasks = loadTasks()
  fs.mkdirSync(LIVE_DIR, { recursive: true })

  if (generateOnly) {
    const files = writePrompts(tasks)
    console.log(`Wrote ${files.length} prompt files to ${path.relative(REPO, PROMPTS_DIR)}/`)
    return { status: 'prompts_generated', prompts: files }
  }

  const sessions = []
  const missing = []

  for (const task of tasks) {
    for (const language of ['axon', 'typescript']) {
      const raw = loadSession(task.id, language)
      if (!raw) {
        missing.push(`${task.id}_${language}`)
        continue
      }
      const turns = raw.turns || []
      const result = evaluateSession(task, language, turns)
      if (raw.provenance) result.provenance = raw.provenance
      sessions.push(result)
      console.log(
        `  ${task.id} [${language}]: first=${result.firstAttemptTestsPassed ? 'PASS' : 'FAIL'}, ` +
          `fixes=${result.fixIterations}, cost=$${result.sessionCostUsd.toFixed(4)}, ` +
          `out=${result.sessionOutputTokens} tok`
      )
    }
  }

  let status = 'complete'
  if (missing.length > 0) {
    status = sessions.length > 0 ? 'partial' : 'not_run'
    const files = writePrompts(tasks.filter((t) => missing.some((m) => m.startsWith(t.id))))
    console.log(`\n  Missing ${missing.length} session(s): ${missing.join(', ')}`)
    console.log(`  Prompts written to ${path.relative(REPO, PROMPTS_DIR)}/ — run agents, save transcripts to live-sessions/`)
  }

  const summary = summarizeSessions(sessions)
  const referenceBacked = sessions.length > 0 && sessions.every((s) => s.provenance === 'reference')
  const findings = []

  if (sessions.length > 0) {
    if (referenceBacked) {
      findings.push('All live sessions are reference-backed (bootstrap) — session cost reflects answer keys, not real AI generation.')
    }
    findings.push(
      `Live sessions (${sessions.length}): Axon first-attempt pass ${Math.round(summary.axon.firstAttemptPassRate * 100)}%, ` +
        `TS ${Math.round(summary.typescript.firstAttemptPassRate * 100)}%.`
    )
    if (summary.axon.avgSessionCostUsd && summary.typescript.avgSessionCostUsd) {
      const costRatio = summary.axon.avgSessionCostUsd / summary.typescript.avgSessionCostUsd
      findings.push(
        `Avg session cost: Axon $${summary.axon.avgSessionCostUsd.toFixed(4)} vs TS $${summary.typescript.avgSessionCostUsd.toFixed(4)} (${costRatio.toFixed(2)}×).`
      )
    }
  } else {
    findings.push('Live AI sessions not run — populate benchmark/track-d-ai-native/live-sessions/*.json from agent runs.')
  }

  return {
    status,
    missing,
    sessions,
    summary,
    referenceBacked,
    findings,
    note: referenceBacked
      ? 'Sessions loaded from reference bootstrap — replace with real agent transcripts for AI writability measurement.'
      : 'Primary Track D metric: total session cost to ship passing tests. Populate live-sessions/ from your AI agent runs.',
  }
}

if (require.main === module) {
  const result = main()
  const file = harness.writeResult('track-d-live', result)
  console.log(`\nResults written to ${path.relative(REPO, file)}`)
}

module.exports = { main, evaluateSession, buildFixPrompt, extractSourceFromAssistant }
