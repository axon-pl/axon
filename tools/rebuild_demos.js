#!/usr/bin/env node
// Recompile all demo examples with the bootstrap Synth compiler.
// Run: node tools/rebuild_demos.js

const fs = require('fs')
const path = require('path')
const { ROOT, bundleSynProject, loadBundle, validateJs } = require('./bootstrap_common')
const { compilerPath } = require('./oracle')

const COMPILER = compilerPath()

function transpile(compiler, entryPath) {
  const source = fs.readFileSync(entryPath, 'utf8')
  const result = compiler.compile(source)
  if (!result?.js) throw new Error(`no JS from ${entryPath}`)
  return { js: result.js, warnings: result.warnings || [] }
}

function writeOut(outPath, js) {
  const err = validateJs(js)
  if (err) {
    throw new Error(`${rel(outPath)}: invalid JavaScript (${err})`)
  }
  fs.writeFileSync(outPath, js, 'utf8')
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/')
}

/** @type {{ label: string, syn: string, out: string, mode: 'single' | 'bundle', embed?: string }[]} */
const DEMOS = [
  // Runnable .sources.js — stdlib loaded separately in HTML
  { label: 'breakout', syn: 'examples/breakout.syn', out: 'demo/breakout.sources.js', mode: 'single' },
  { label: 'drift', syn: 'examples/drift.syn', out: 'demo/drift.sources.js', mode: 'single' },
  { label: 'expedition', syn: 'examples/expedition.syn', out: 'demo/expedition.sources.js', mode: 'single' },
  { label: 'invaders', syn: 'examples/invaders.syn', out: 'demo/invaders.sources.js', mode: 'single' },
  { label: 'kanban', syn: 'examples/kanban.syn', out: 'demo/kanban.sources.js', mode: 'single' },
  { label: 'neon_life', syn: 'examples/neon_life.syn', out: 'demo/neon_life.sources.js', mode: 'single' },
  { label: 'vibe_grid', syn: 'examples/vibe_grid.syn', out: 'demo/vibe_grid.sources.js', mode: 'single' },

  // Self-contained bundles (stdlib inlined)
  { label: 'bazaar', syn: 'examples/bazaar/main.syn', out: 'demo/bazaar.sources.js', mode: 'bundle' },
  { label: 'chronicle', syn: 'examples/chronicle/main.syn', out: 'demo/chronicle.sources.js', mode: 'bundle' },
  { label: 'dungeon', syn: 'examples/dungeon/main.syn', out: 'demo/dungeon.sources.js', mode: 'bundle' },

  // Runnable + source-viewer embed
    { label: 'controls', syn: 'examples/controls.syn', out: 'demo/controls.synth.js', mode: 'single' },
    { label: 'combat', syn: 'examples/combat.syn', out: 'demo/combat.synth.js', mode: 'single', embed: 'embed_combat.js' },
    { label: 'music', syn: 'examples/music.syn', out: 'demo/music.synth.js', mode: 'single', embed: 'embed_music.js' },
    { label: 'rpg', syn: 'examples/rpg.syn', out: 'demo/rpg.synth.js', mode: 'single', embed: 'embed_rpg.js' },
]

function lineDiff(before, after) {
  const b = before.split('\n').length
  const a = after.split('\n').length
  const delta = a - b
  return { before: b, after: a, delta, changed: before !== after }
}

function main() {
  const compiler = loadBundle(COMPILER)
  const report = []

  console.log(`Rebuilding demos with ${rel(COMPILER)}\n`)

  for (const demo of DEMOS) {
    const synPath = path.join(ROOT, demo.syn)
    const outPath = path.join(ROOT, demo.out)
    const before = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : ''

    let js
    let warnings = []
    if (demo.mode === 'bundle') {
      const bundle = bundleSynProject(COMPILER, synPath, { headerComments: false })
      js = bundle.js
      warnings = bundle.warnings
    } else {
      const result = transpile(compiler, synPath)
      js = result.js
      warnings = result.warnings
    }

    writeOut(outPath, js)
    const stats = lineDiff(before, js)
    report.push({ ...demo, ...stats, warnings: warnings.length })

    const warnStr = warnings.length ? ` (${warnings.length} warnings)` : ''
    const deltaStr = stats.changed
      ? `${stats.before} → ${stats.after} lines (${stats.delta >= 0 ? '+' : ''}${stats.delta})`
      : 'unchanged'
    console.log(`✓ ${demo.label.padEnd(12)} ${rel(outPath)} — ${deltaStr}${warnStr}`)

    if (demo.embed) {
      require(path.join(__dirname, demo.embed))
    }
  }

  const changed = report.filter(r => r.changed)
  console.log(`\n${'─'.repeat(52)}`)
  console.log(`  ${report.length} demos rebuilt · ${changed.length} changed · ${report.length - changed.length} identical`)
  console.log(`${'─'.repeat(52)}\n`)

  return report
}

if (require.main === module) {
  try {
    main()
  } catch (e) {
    console.error(`Error: ${e.message ?? e}`)
    process.exit(1)
  }
}

module.exports = { DEMOS, main }
