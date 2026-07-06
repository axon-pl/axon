'use strict'

// Dev-only: build live-sessions/*.json from reference solutions so the
// D-live pipeline can be tested without running external AI agents.
// Sessions are tagged provenance=reference — not real AI writability data.

const fs = require('fs')
const path = require('path')
const tokens = require('../lib/tokens.js')
const { REPO, loadTasks, SOLUTIONS } = require('./lib/harness-common.js')

const LIVE_DIR = path.join(__dirname, 'live-sessions')

function main() {
  const tasks = loadTasks()
  fs.mkdirSync(LIVE_DIR, { recursive: true })
  let count = 0

  for (const task of tasks) {
    for (const language of ['axon', 'typescript']) {
      const ext = language === 'axon' ? 'axn' : 'ts'
      const source = fs.readFileSync(path.join(SOLUTIONS, `${task.id}.${ext}`), 'utf8')
      const prompt =
        language === 'axon'
          ? tokens.buildSimulatedPrompt(task.spec, 'axon', REPO)
          : tokens.buildSimulatedPrompt(task.spec, 'typescript', REPO)

      const payload = {
        taskId: task.id,
        language,
        provenance: 'reference',
        note: 'Bootstrap from hidden answer key — for pipeline testing only, not AI writability.',
        turns: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: '```\n' + source + '\n```' },
        ],
      }
      fs.writeFileSync(path.join(LIVE_DIR, `${task.id}_${language}.json`), JSON.stringify(payload, null, 2) + '\n')
      count++
    }
  }

  console.log(`Wrote ${count} reference-backed sessions to ${path.relative(REPO, LIVE_DIR)}/`)
  console.log('Run: node benchmark/track-d-ai-native/run.js --live')
}

main()
