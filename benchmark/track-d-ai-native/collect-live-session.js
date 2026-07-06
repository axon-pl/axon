'use strict'

// Build a live-sessions/*.json transcript from a prompt + generated source,
// evaluate it, and optionally append fix turns (up to 3).

const fs = require('fs')
const path = require('path')
const tokens = require('../lib/tokens.js')
const {
  REPO,
  loadTasks,
  evaluateAxonSource,
  evaluateTypeScriptSource,
  buildFixPrompt,
  testsPassed,
} = require('./lib/harness-common.js')
const { evaluateSession } = require('./run-live.js')

const LIVE_DIR = path.join(__dirname, 'live-sessions')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { task: null, language: null, source: null, maxFixes: 0 }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task') out.task = args[++i]
    else if (args[i] === '--language') out.language = args[++i]
    else if (args[i] === '--source') out.source = args[++i]
    else if (args[i] === '--max-fixes') out.maxFixes = parseInt(args[++i], 10)
  }
  return out
}

function saveSession(taskId, language, turns) {
  fs.mkdirSync(LIVE_DIR, { recursive: true })
  const file = path.join(LIVE_DIR, `${taskId}_${language}.json`)
  fs.writeFileSync(file, JSON.stringify({ taskId, language, turns }, null, 2) + '\n', 'utf8')
  return file
}

function main() {
  const { task: taskId, language, source: sourcePath, maxFixes } = parseArgs()
  if (!taskId || !language || !sourcePath) {
    console.error('Usage: node collect-live-session.js --task ID --language axon|typescript --source FILE [--max-fixes N]')
    process.exit(1)
  }

  const tasks = loadTasks()
  const task = tasks.find((t) => t.id === taskId)
  if (!task) throw new Error(`Unknown task: ${taskId}`)

  const initialPrompt =
    language === 'axon'
      ? tokens.buildSimulatedPrompt(task.spec, 'axon', REPO)
      : tokens.buildSimulatedPrompt(task.spec, 'typescript', REPO)

  const source = fs.readFileSync(path.resolve(sourcePath), 'utf8')
  const turns = [
    { role: 'user', content: initialPrompt },
    { role: 'assistant', content: '```\n' + source + '\n```' },
  ]

  let evalResult =
    language === 'axon' ? evaluateAxonSource(taskId, source) : evaluateTypeScriptSource(taskId, source)

  let fixes = 0
  while (!testsPassed(evalResult) && fixes < maxFixes) {
    const error = evalResult.compileError || `Tests: ${evalResult.tests?.passed}/${evalResult.tests?.total} passed`
    const fixPrompt = buildFixPrompt(task.spec, language, source, error)
    turns.push({ role: 'user', content: fixPrompt })
    console.error(`Fix ${fixes + 1} needed: ${error.slice(0, 120)}`)
    console.error('Re-run with corrected --source after applying fix prompt (or append assistant turn manually).')
    break
  }

  const file = saveSession(taskId, language, turns)
  const session = evaluateSession(task, language, turns)
  console.log(JSON.stringify({ saved: file, session }, null, 2))
}

if (require.main === module) main()

module.exports = { saveSession }
