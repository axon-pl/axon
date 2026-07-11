#!/usr/bin/env node
/** Golden + multi-file smoke for synth --spec (v1.2). */
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { loadOracle } = require('./oracle')
const { specFromEntry, specFromSource } = require('./synth_spec')

const ROOT = path.join(__dirname, '..')
const GOLDEN = path.join(__dirname, 'goldens', 'spec_intent_router.json')
const compiler = loadOracle()

function moduleOf(spec, file) {
  const mod = spec.modules.find((m) => m.file === file || m.file.endsWith('/' + file))
  assert.ok(mod, `module missing: ${file}`)
  return mod
}

// ── intent_router golden ───────────────────────────────────────────────────
const router = specFromEntry(compiler, path.join(ROOT, 'examples/intent_router.syn'), { root: ROOT })
assert.strictEqual(router.synthSpecVersion, '0.1')
assert.strictEqual(router.entry, 'examples/intent_router.syn')
assert.strictEqual(router.modules.length, 1)

const rmod = moduleOf(router, 'examples/intent_router.syn')
const route = rmod.functions.find((f) => f.name === 'route_intent')
assert.ok(route, 'route_intent missing')
assert.ok(route.likely.length >= 5, 'expected likely arms')
assert.ok(route.exactMatchArms.some((a) => a.value === 'quit'), 'exact quit arm')
assert.strictEqual(route.params[0].type, 'string')
assert.strictEqual(route.returnType, 'string')

if (process.env.UPDATE_SPEC_GOLDEN === '1') {
  fs.mkdirSync(path.dirname(GOLDEN), { recursive: true })
  fs.writeFileSync(GOLDEN, JSON.stringify(router, null, 2) + '\n', 'utf8')
  console.log('wrote', path.relative(ROOT, GOLDEN).replace(/\\/g, '/'))
} else {
  assert.ok(fs.existsSync(GOLDEN), `missing golden — run UPDATE_SPEC_GOLDEN=1 npm run test:spec`)
  const expected = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'))
  assert.deepStrictEqual(router, expected, 'intent_router spec diverged from golden')
}

// ── controls (constraints + @intent) ───────────────────────────────────────
const controls = specFromEntry(compiler, path.join(ROOT, 'examples/controls.syn'), { root: ROOT })
const cmod = moduleOf(controls, 'examples/controls.syn')
const withIntent = cmod.functions.filter((f) => f.intent)
assert.ok(withIntent.length >= 1, 'controls should have @intent fns')
assert.ok(cmod.types.some((t) => t.constraint), 'expected constrained type')

// ── multi-file (dungeon follows imports) ───────────────────────────────────
const dungeon = specFromEntry(compiler, path.join(ROOT, 'examples/dungeon/main.syn'), { root: ROOT })
assert.strictEqual(dungeon.entry, 'examples/dungeon/main.syn')
assert.ok(dungeon.modules.length >= 4, `expected >=4 dungeon modules, got ${dungeon.modules.length}`)
const files = dungeon.modules.map((m) => m.file).sort()
assert.ok(files.some((f) => f.endsWith('tiles.syn')), 'tiles.syn missing from graph')
assert.ok(files.some((f) => f.endsWith('main.syn')), 'main.syn missing from graph')
const totalFns = dungeon.modules.reduce((n, m) => n + m.functions.length, 0)
assert.ok(totalFns >= 5, `expected several fns across dungeon, got ${totalFns}`)

// ── -o path exercised via JSON round-trip of single-source helper ──────────
const src = fs.readFileSync(path.join(ROOT, 'examples/intent_router.syn'), 'utf8')
const fromSrc = specFromSource(compiler, src, { file: 'examples/intent_router.syn' })
assert.deepStrictEqual(fromSrc, router)

console.log('ok  synth spec')
console.log(`  golden: intent_router (${route.likely.length} likely arms)`)
console.log(`  controls: ${withIntent.length} @intent fns, ${cmod.types.length} types`)
console.log(`  dungeon: ${dungeon.modules.length} modules, ${totalFns} fns`)
