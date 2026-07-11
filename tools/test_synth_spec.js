#!/usr/bin/env node
/** Smoke test for synth --spec (v1.2 spike). */
'use strict'

const assert = require('assert')
const path = require('path')
const { loadOracle } = require('./oracle')
const { specFromSource } = require('./synth_spec')

const ROOT = path.join(__dirname, '..')
const compiler = loadOracle()

function load(rel) {
  const fs = require('fs')
  const file = path.join(ROOT, rel)
  const source = fs.readFileSync(file, 'utf8')
  return specFromSource(compiler, source, { file: rel.replace(/\\/g, '/') })
}

const router = load('examples/intent_router.syn')
assert.strictEqual(router.synthSpecVersion, '0.1')
assert.strictEqual(router.file, 'examples/intent_router.syn')
const route = router.functions.find((f) => f.name === 'route_intent')
assert.ok(route, 'route_intent missing')
assert.ok(route.likely.length >= 5, 'expected likely arms')
assert.ok(route.exactMatchArms.some((a) => a.value === 'quit'), 'exact quit arm')
assert.strictEqual(route.params[0].type, 'string')
assert.strictEqual(route.returnType, 'string')

const controls = load('examples/controls.syn')
const withIntent = controls.functions.filter((f) => f.intent)
assert.ok(withIntent.length >= 1, 'controls should have @intent fns')
assert.ok(controls.types.some((t) => t.constraint), 'expected constrained type')

console.log('ok  synth spec smoke')
console.log(`  intent_router: ${router.functions.length} fns, route_intent likely=${route.likely.length}`)
console.log(`  controls: ${withIntent.length} @intent fns, ${controls.types.length} types`)
