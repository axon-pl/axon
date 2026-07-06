'use strict'

// Shared harness for Track D: acceptance tests, compile/run scoring, task loading.

const fs = require('fs')
const os = require('os')
const path = require('path')
const vm = require('vm')
const { execFileSync } = require('child_process')

const harness = require('../../lib/harness.js')

const REPO = path.join(__dirname, '..', '..', '..')
const SOLUTIONS = path.join(__dirname, '..', 'solutions')

function loadTasks() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tasks.json'), 'utf8')).tasks
}

function runNamedTests(tests) {
  const results = []
  let passed = 0
  for (const [name, fn] of tests) {
    let ok = false
    let error = null
    try {
      ok = !!fn()
    } catch (e) {
      error = String(e).slice(0, 120)
    }
    if (ok) passed++
    results.push({ name, ok, error })
  }
  return { passed, failed: tests.length - passed, total: tests.length, results }
}

const ACCEPTANCE = {
  inventory_stack(mod) {
    const { inventory_stack, Item } = mod
    const item = (name, count) => (Item ? Item(name, count) : { name, count })
    return runNamedTests([
      ['empty', () => inventory_stack([], 10).length === 0],
      ['merge', () => inventory_stack([item('wood', 3), item('wood', 4)], 10)[0].count === 7],
      ['one stack', () => inventory_stack([item('wood', 3), item('wood', 4)], 10).length === 1],
      ['split', () => inventory_stack([item('stone', 25)], 10).length === 3],
      ['remainder', () => inventory_stack([item('stone', 25)], 10)[2].count === 5],
      ['exact multiple', () => inventory_stack([item('iron', 20)], 10).length === 2],
      ['distinct', () => inventory_stack([item('a', 1), item('b', 1)], 10).length === 2],
    ])
  },

  parse_int_safe(mod) {
    const { parse_int_safe } = mod
    const ok = (s) => {
      const r = parse_int_safe(s)
      if (r.tag === 'Ok') return r.value
      if (r.ok === true) return r.value
      return -999999
    }
    const isErr = (s) => {
      const r = parse_int_safe(s)
      if (r.tag === 'Err') return true
      if (r.ok === false) return true
      return false
    }
    return runNamedTests([
      ['simple', () => ok('42') === 42],
      ['negative', () => ok('-7') === -7],
      ['zero', () => ok('0') === 0],
      ['neg zero', () => ok('-0') === 0],
      ['empty err', () => isErr('')],
      ['trailing err', () => isErr('12a')],
      ['leading zeros err', () => isErr('007')],
      ['bare minus err', () => isErr('-')],
    ])
  },

  classify_grade(mod) {
    const { classify_grade } = mod
    return runNamedTests([
      ['90 is A', () => classify_grade(90.0) === 'A'],
      ['89.5 is B', () => classify_grade(89.5) === 'B'],
      ['100 is A', () => classify_grade(100.0) === 'A'],
      ['60 is D', () => classify_grade(60.0) === 'D'],
      ['59.9 is F', () => classify_grade(59.9) === 'F'],
      ['0 is F', () => classify_grade(0.0) === 'F'],
      ['negative Invalid', () => classify_grade(-1.0) === 'Invalid'],
      ['over 100 Invalid', () => classify_grade(100.5) === 'Invalid'],
    ])
  },

  shape_area(mod) {
    const { area, Circle, Rect, Triangle } = mod
    const circle = Circle ? Circle(1.0) : { kind: 'circle', r: 1.0 }
    const rect43 = Rect ? Rect(4.0, 3.0) : { kind: 'rect', w: 4.0, h: 3.0 }
    const tri64 = Triangle ? Triangle(6.0, 4.0) : { kind: 'triangle', base: 6.0, height: 4.0 }
    const rect05 = Rect ? Rect(0.0, 5.0) : { kind: 'rect', w: 0.0, h: 5.0 }
    const circle2 = Circle ? Circle(2.0) : { kind: 'circle', r: 2.0 }
    return runNamedTests([
      ['circle r=1', () => area(circle) > 3.1415 && area(circle) < 3.1416],
      ['rect 4x3', () => area(rect43) === 12.0],
      ['triangle 6x4', () => area(tri64) === 12.0],
      ['degenerate rect', () => area(rect05) === 0.0],
      ['circle r=2', () => area(circle2) > 12.566 && area(circle2) < 12.567],
    ])
  },

  rgb_to_hex(mod) {
    const { rgb_to_hex } = mod
    return runNamedTests([
      ['black', () => rgb_to_hex(0, 0, 0) === '#000000'],
      ['white', () => rgb_to_hex(255, 255, 255) === '#ffffff'],
      ['clamp high', () => rgb_to_hex(300, 0, 0) === '#ff0000'],
      ['clamp low', () => rgb_to_hex(0, -20, 0) === '#000000'],
      ['zero pad', () => rgb_to_hex(1, 2, 3) === '#010203'],
      ['mixed', () => rgb_to_hex(255, 128, 64) === '#ff8040'],
    ])
  },

  fib_memo(mod) {
    const { fib } = mod
    return runNamedTests([
      ['fib 0', () => fib(0) === 0],
      ['fib 1', () => fib(1) === 1],
      ['fib 2', () => fib(2) === 1],
      ['fib 10', () => fib(10) === 55],
      ['fib 30', () => fib(30) === 832040],
      ['fib 40', () => fib(40) === 102334155],
      ['negative', () => fib(-5) === 0],
    ])
  },
}

function guessExports(source) {
  const names = new Set()
  for (const m of source.matchAll(/\bfn\s+(\w+)/g)) names.add(m[1])
  for (const m of source.matchAll(/\|\s*(\w+)\s*\{/g)) names.add(m[1])
  if (/record Item/.test(source)) names.add('Item')
  return [...names]
}

function loadAxonExports(source) {
  const js = harness.transpile(source)
  const lastBrace = js.lastIndexOf('}')
  const exportNames = guessExports(source)
  const patched =
    lastBrace >= 0
      ? js.slice(0, lastBrace) + `\n  globalThis.__axonExports = { ${exportNames.join(', ')} };\n` + js.slice(lastBrace)
      : js
  const ctx = { console, process, Math, JSON, Array, Object, Map, Set, String, Number, Boolean }
  vm.createContext(ctx)
  vm.runInContext(patched, ctx)
  return ctx.__axonExports || ctx
}

function evaluateAxonSource(taskId, source) {
  const out = { compiled: false, compileError: null, tests: null }
  try {
    const js = harness.transpile(source)
    out.compiled = true
    const { testResult } = harness.runInVm(js)
    if (testResult && testResult.total > 0) {
      out.tests = { passed: testResult.passed, failed: testResult.failed, total: testResult.total, source: '@test' }
    } else {
      const mod = loadAxonExports(source)
      out.tests = { ...ACCEPTANCE[taskId](mod), source: 'acceptance' }
    }
  } catch (e) {
    out.compileError = String(e).slice(0, 500)
  }
  return out
}

function evaluateTypeScriptSource(taskId, source, basename = taskId) {
  const out = { compiled: false, compileError: null, tests: null }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'axon-track-d-'))
  const srcFile = path.join(tmp, `${basename}.ts`)

  try {
    fs.writeFileSync(srcFile, source, 'utf8')
    execFileSync(
      'npx',
      ['tsc', '--target', 'es2020', '--module', 'commonjs', '--esModuleInterop', '--skipLibCheck', '--outDir', tmp, srcFile],
      { cwd: REPO, stdio: 'pipe' }
    )
    out.compiled = true
    const mod = require(path.join(tmp, `${basename}.js`))
    out.tests = { ...ACCEPTANCE[taskId](mod), source: 'acceptance' }
  } catch (e) {
    const msg = ((e.stdout && e.stdout.toString()) || '') + ((e.stderr && e.stderr.toString()) || '') + String(e.message || e)
    out.compileError = msg.slice(0, 500)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  return out
}

function scoreReferenceSolution(taskId) {
  const axonFile = path.join(SOLUTIONS, `${taskId}.axn`)
  const tsFile = path.join(SOLUTIONS, `${taskId}.ts`)
  return {
    axon: {
      language: 'axon',
      file: path.relative(REPO, axonFile),
      ...evaluateAxonSource(taskId, fs.readFileSync(axonFile, 'utf8')),
    },
    typescript: {
      language: 'typescript',
      file: path.relative(REPO, tsFile),
      ...evaluateTypeScriptSource(taskId, fs.readFileSync(tsFile, 'utf8')),
    },
  }
}

function buildFixPrompt(taskSpec, language, previousSource, error) {
  return [
    `Fix the ${language === 'axon' ? 'Axon' : 'TypeScript'} implementation for this task.`,
    '',
    '## Task',
    taskSpec,
    '',
    '## Previous attempt',
    '```',
    previousSource,
    '```',
    '',
    '## Error',
    error,
    '',
    'Return only the corrected full source file.',
  ].join('\n')
}

function testsPassed(result) {
  return result.tests && result.tests.failed === 0 && result.tests.total > 0
}

module.exports = {
  REPO,
  SOLUTIONS,
  loadTasks,
  ACCEPTANCE,
  evaluateAxonSource,
  evaluateTypeScriptSource,
  scoreReferenceSolution,
  buildFixPrompt,
  testsPassed,
}
