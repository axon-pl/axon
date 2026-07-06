'use strict'

// Track A — Correctness: does the Axon compiler actually work beyond the
// 3 files its CI checks?  Runs every @test-bearing example, verifies bundle
// reproducibility, and probes ~17 adversarial edge cases.

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT = path.join(__dirname, '..', '..')
const CLI = path.join(ROOT, 'dist', 'cli.js')
const harness = require(path.join(ROOT, 'benchmark', 'lib', 'harness.js'))

const compiler = harness.loadCompiler()
const { Lexer, Parser, Checker, Codegen } = compiler

const findings = []

// ── Task 1: run every @test-bearing example ──────────────────────────────────

const EXAMPLE_FILES = [
  'examples/rpg.axn',
  'examples/v04_features.axn',
  'examples/v052_features.axn',
  'examples/v06_features.axn',
  'examples/v07_features.axn',
  'examples/v095_features.axn',
  'examples/bazaar/items.axn',
  'examples/dungeon/config.axn',
  'examples/dungeon/generator.axn',
  'examples/dungeon/tiles.axn',
  // These two import other modules and are exercised via `cli --test` (auto-bundle).
  'examples/bazaar/main.axn',
  'examples/dungeon/main.axn',
]

function runViaCli(fullPath) {
  const r = spawnSync(process.execPath, [CLI, '--test', fullPath], {
    encoding: 'utf8',
    timeout: 30000,
    cwd: ROOT,
  })
  const out = (r.stdout || '') + (r.stderr || '')
  const m = out.match(/(\d+) passed, (\d+) failed, (\d+) total/)
  if (m) return { passed: +m[1], failed: +m[2], total: +m[3] }
  return { passed: 0, failed: 0, total: 0, error: out.trim().replace(/\s+/g, ' ').slice(0, 250) || `exit ${r.status}` }
}

function runExampleFile(relPath) {
  const fullPath = path.join(ROOT, relPath)
  const src = fs.readFileSync(fullPath, 'utf8')
  const hasImport = /^import\s/m.test(src)

  if (!hasImport) {
    try {
      const js = harness.transpile(src, compiler)
      const { testResult } = harness.runInVm(js)
      if (testResult && testResult.total > 0) {
        return { file: relPath, via: 'harness', passed: testResult.passed, failed: testResult.failed, total: testResult.total }
      }
    } catch (e) {
      // fall through to CLI (e.g. vm context missing globals like setTimeout)
    }
  }
  const r = runViaCli(fullPath)
  return { file: relPath, via: 'cli', ...r }
}

console.log('── Task 1: example @test files ──────────────────────────────')
const exampleResults = []
for (const rel of EXAMPLE_FILES) {
  const res = runExampleFile(rel)
  exampleResults.push(res)
  const status = res.error ? `ERROR: ${res.error}` : `${res.passed} passed, ${res.failed} failed, ${res.total} total`
  console.log(`  ${rel.padEnd(36)} [${res.via}] ${status}`)
  if (res.error) findings.push(`${rel}: could not obtain test results — ${res.error}`)
  else if (res.failed > 0) findings.push(`${rel}: ${res.failed} of ${res.total} inline @test assertions FAILED`)
}
const totalAssertions = exampleResults.reduce((a, r) => a + r.total, 0)
const totalPassed = exampleResults.reduce((a, r) => a + r.passed, 0)
const totalFailed = exampleResults.reduce((a, r) => a + r.failed, 0)
console.log(`  TOTAL: ${totalPassed} passed, ${totalFailed} failed, ${totalAssertions} total\n`)

// ── Task 2: bundle reproducibility ────────────────────────────────────────────

console.log('── Task 2: bundle reproducibility ───────────────────────────')
function normalize(s) {
  return s
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
}

let bundleReproducible = false
let bundleNote = ''
{
  const r = spawnSync(process.execPath, [CLI, '--bundle', path.join(ROOT, 'examples/dungeon/main.axn')], {
    encoding: 'utf8',
    timeout: 30000,
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
  })
  if (r.status !== 0) {
    bundleNote = `--bundle exited ${r.status}: ${(r.stderr || '').slice(0, 200)}`
    findings.push(`Bundle command failed: ${bundleNote}`)
  } else {
    const fresh = normalize(r.stdout)
    const reference = normalize(fs.readFileSync(path.join(ROOT, 'examples/dungeon/bundle.js'), 'utf8'))
    if (fresh === reference) {
      bundleReproducible = true
      bundleNote = `Fresh bundle byte-identical to checked-in examples/dungeon/bundle.js after whitespace normalization (${fresh.split('\n').length} lines).`
    } else {
      const fl = fresh.split('\n')
      const rl = reference.split('\n')
      let i = 0
      while (i < Math.min(fl.length, rl.length) && fl[i] === rl[i]) i++
      bundleNote =
        `Mismatch: fresh=${fl.length} lines, reference=${rl.length} lines. ` +
        `First diff at line ${i + 1}: fresh=${JSON.stringify((fl[i] || '<EOF>').slice(0, 80))} ` +
        `vs reference=${JSON.stringify((rl[i] || '<EOF>').slice(0, 80))}`
      findings.push(`Checked-in dungeon bundle.js is NOT reproducible from current compiler. ${bundleNote}`)
    }
  }
  console.log(`  reproducible: ${bundleReproducible} — ${bundleNote}\n`)
}

// ── Task 3: adversarial edge cases ────────────────────────────────────────────

// Compile in-process, returning stage-by-stage outcome.
function compile(src) {
  const out = { parseErrors: null, diagnostics: [], js: null, threw: null }
  try {
    const tokens = new Lexer(src).tokenize()
    const { ast, errors } = new Parser(tokens).parse()
    if (errors && errors.length > 0) {
      out.parseErrors = errors.map((e) => e.message)
      return out
    }
    out.diagnostics = new Checker().check(ast) || []
    out.js = new Codegen().generate(ast)
  } catch (e) {
    out.threw = String(e)
  }
  return out
}

// Run malformed input through lexer+parser in a CHILD process with a timeout,
// so a parser crash or infinite loop cannot take down the benchmark itself.
function parseInChild(src) {
  const script = `
    const path = require('path');
    const { Lexer } = require(path.join(${JSON.stringify(ROOT)}, 'dist', 'lexer.js'));
    const { Parser } = require(path.join(${JSON.stringify(ROOT)}, 'dist', 'parser.js'));
    let src = '';
    process.stdin.on('data', (d) => (src += d));
    process.stdin.on('end', () => {
      try {
        const tokens = new Lexer(src).tokenize();
        const { errors } = new Parser(tokens).parse();
        console.log(JSON.stringify({ threw: false, errorCount: (errors || []).length, messages: (errors || []).slice(0, 3).map((e) => e.message) }));
      } catch (e) {
        console.log(JSON.stringify({ threw: true, message: String(e).slice(0, 200) }));
      }
    });
  `
  const r = spawnSync(process.execPath, ['-e', script], { input: src, encoding: 'utf8', timeout: 5000 })
  if (r.error || r.status === null || !r.stdout) {
    return { hung: true, detail: r.error ? String(r.error) : 'no output / killed (possible infinite loop)' }
  }
  try {
    return { hung: false, ...JSON.parse(r.stdout) }
  } catch {
    return { hung: false, threw: true, message: 'child produced unparseable output: ' + r.stdout.slice(0, 100) }
  }
}

// Run generated JS + its @test blocks; also capture uncaught vm throw.
function runTests(js) {
  try {
    const { testResult } = harness.runInVm(js)
    return { ran: true, testResult }
  } catch (e) {
    return { ran: false, vmError: String(e) }
  }
}

const CASES = [
  {
    name: 'where-guard-fullform-violation',
    description: 'Full-form fn with `where`-constrained param called with violating value: generated JS must throw at runtime',
    src: `
type Health = int where value >= 0 && value <= 100
fn set_hp :: (hp: Health) -> int {
  hp
}
let boom = set_hp(150)
`,
    expected: 'vm throws AxonConstraintError',
    check(c) {
      if (!c.js) return { ok: false, actual: 'did not compile' }
      const r = runTests(c.js)
      if (!r.ran && /AxonConstraintError/.test(r.vmError)) return { ok: true, actual: 'threw AxonConstraintError as claimed' }
      return { ok: false, actual: r.ran ? 'ran without throwing — constraint NOT enforced' : `threw wrong error: ${r.vmError.slice(0, 120)}` }
    },
  },
  {
    name: 'where-guard-fullform-valid',
    description: 'Full-form fn with constrained param called with a VALID value: must pass and return it',
    src: `
type Health = int where value >= 0 && value <= 100
fn set_hp :: (hp: Health) -> int {
  hp
}
@test "valid health accepted" { set_hp(50) == 50 }
`,
    expected: 'runs, 1 test passes',
    check(c) {
      if (!c.js) return { ok: false, actual: 'did not compile' }
      const r = runTests(c.js)
      const ok = r.ran && r.testResult && r.testResult.passed === 1 && r.testResult.failed === 0
      return { ok, actual: ok ? 'passed' : JSON.stringify(r.testResult || r.vmError) }
    },
  },
  {
    name: 'where-guard-shortform-violation',
    description: 'SHORT-form fn (`fn f(x: T) = ...`) with constrained param and violating value — README says guards are injected automatically',
    src: `
type Health = int where value >= 0 && value <= 100
fn set_hp(hp: Health) = hp
let boom = set_hp(150)
`,
    expected: 'vm throws AxonConstraintError (per README claim)',
    check(c) {
      if (!c.js) return { ok: false, actual: 'did not compile' }
      const guardEmitted = /__validate_Health\(hp\)/.test(c.js)
      const r = runTests(c.js)
      if (!r.ran && /AxonConstraintError/.test(r.vmError)) return { ok: true, actual: 'threw as claimed' }
      return {
        ok: false,
        actual: `no guard ${guardEmitted ? 'triggered' : 'emitted in generated JS'}; value 150 accepted silently`,
        note: 'Constraint guards are only injected for full-form `fn name :: (...)` declarations, not short-form.',
      }
    },
  },
  {
    name: 'exhaustive-missing-case-checker',
    description: '@exhaustive match on a 3-variant union covering only 2 variants: checker should warn',
    src: `
type Shape = | Circle { r: float } | Rect { w: float, h: float } | Point

fn area :: (s: Shape) -> float {
  @exhaustive
  match s {
    | Circle { r } => 3.14 * r * r
    | Rect { w, h } => w * h
  }
}
`,
    expected: 'checker diagnostic mentioning the missing case',
    check(c) {
      if (!c.js) return { ok: false, actual: 'did not compile' }
      const hit = c.diagnostics.find((d) => /missing case/i.test(d.message))
      return { ok: !!hit, actual: hit ? `warning emitted: "${hit.message}"` : `no diagnostic (got ${JSON.stringify(c.diagnostics)})` }
    },
  },
  {
    name: 'exhaustive-missing-case-runtime',
    description: 'Same non-exhaustive match evaluated on the uncovered variant at runtime — what does codegen do?',
    src: `
type Shape = | Circle { r: float } | Rect { w: float, h: float } | Point

fn area :: (s: Shape) -> float {
  @exhaustive
  match s {
    | Circle { r } => 3.14 * r * r
    | Rect { w, h } => w * h
  }
}
@test "uncovered variant behavior" { area(Point) === undefined }
`,
    expected: 'defined behavior on uncovered arm (undefined or throw), not a crash',
    check(c) {
      if (!c.js) return { ok: false, actual: 'did not compile' }
      const r = runTests(c.js)
      if (!r.ran) return { ok: false, actual: `vm crashed: ${r.vmError.slice(0, 120)}` }
      const t = r.testResult
      if (t && t.passed === 1) return { ok: true, actual: 'uncovered arm silently yields undefined (no runtime error)' }
      return { ok: true, actual: `arm did not yield undefined: ${JSON.stringify(t && t.results)}`, note: 'still graceful — no crash' }
    },
  },
  {
    name: 'result-question-happy-path',
    description: 'Result + `?` propagation: Ok flows through and is unwrapped',
    src: `
@throws
fn parse_positive(s: string) -> any {
  let n = parseInt(s)
  if isNaN(n) { err("not a number") }
  if n <= 0 { err("not positive") }
  ok(n)
}
@throws
fn tripled(s: string) -> any {
  let n = parse_positive(s)?
  ok(n * 3)
}
@test "ok path" { tripled("4").tag == "Ok" && tripled("4").value == 12 }
`,
    expected: '1 test passes',
    check: expectTests(1, 0),
  },
  {
    name: 'result-question-error-path',
    description: 'Result + `?` propagation: Err short-circuits and bubbles the original message',
    src: `
@throws
fn parse_positive(s: string) -> any {
  let n = parseInt(s)
  if isNaN(n) { err("not a number") }
  if n <= 0 { err("not positive") }
  ok(n)
}
@throws
fn tripled(s: string) -> any {
  let n = parse_positive(s)?
  ok(n * 3)
}
@test "err propagates" { tripled("nope").tag == "Err" && tripled("nope").message == "not a number" }
@test "err from second guard" { tripled("-2").tag == "Err" && tripled("-2").message == "not positive" }
`,
    expected: '2 tests pass',
    check: expectTests(2, 0),
  },
  {
    name: 'generics-instantiation',
    description: 'Generic record + generic functions instantiated at several types',
    src: `
record Box<T> { value: T }
fn boxed<T>(v: T) -> Box<T> = { value: v }
fn map_all<T, U>(xs: T[], f: fn(T) -> U) -> U[] = xs.map(f)
@test "box int" { boxed(7).value == 7 }
@test "box string" { boxed("hi").value == "hi" }
@test "generic map" { map_all([1, 2, 3], x => x + 1)[2] == 4 }
`,
    expected: '3 tests pass',
    check: expectTests(3, 0),
  },
  {
    name: 'let-mut-reassignment-scoping',
    description: '`let mut` allows reassignment; loop-accumulated value visible after the loop; inner shadowing does not leak',
    src: `
fn tally() -> int {
  let mut total = 0
  for i in range(0, 5) {
    total = total + i
  }
  total
}
fn shadow() -> int {
  let x = 1
  if true {
    let x = 99
  }
  x
}
@test "mut accumulates" { tally() == 10 }
@test "inner let does not leak" { shadow() == 1 }
`,
    expected: '2 tests pass',
    check: expectTests(2, 0),
  },
  {
    name: 'let-immutable-reassignment',
    description: 'Reassigning a plain (non-mut) `let` — an immutability-focused language should reject this at compile time',
    src: `
fn sneaky() -> int {
  let x = 1
  x = 2
  x
}
@test "reassigned" { sneaky() == 2 }
`,
    expected: 'compile-time error or diagnostic rejecting reassignment of non-mut binding',
    check(c) {
      if (c.parseErrors) return { ok: true, actual: `parser rejected: ${c.parseErrors[0]}` }
      const diag = c.diagnostics.find((d) => /mut|reassign|immutab/i.test(d.message))
      if (diag) return { ok: true, actual: `checker diagnostic: ${diag.message}` }
      const r = runTests(c.js)
      const silently = r.ran && r.testResult && r.testResult.passed === 1
      return {
        ok: false,
        actual: silently
          ? 'compiles to JS `let` and reassignment succeeds silently — immutability of plain `let` is not enforced anywhere'
          : `no diagnostic; runtime: ${JSON.stringify(r.testResult || r.vmError)}`,
      }
    },
  },
  {
    name: 'tagged-union-pattern-match',
    description: 'Tagged union constructors + match with payload destructuring and wildcard',
    src: `
type Event = | Click { x: int, y: int } | Key { code: string } | Idle
fn describe(e: Event) -> string =
  match e {
    | Click { x, y } => "click " + x + "," + y
    | Key { code } => "key " + code
    | Idle => "idle"
  }
@test "click payload" { describe(Click(3, 4)) == "click 3,4" }
@test "key payload" { describe(Key("Esc")) == "key Esc" }
@test "unit variant" { describe(Idle) == "idle" }
`,
    expected: '3 tests pass',
    check: expectTests(3, 0),
  },
  {
    name: 'pipeline-operators',
    description: 'Pipelines |> with .field shorthand, `as` named intermediates, and stdlib sum',
    src: `
let heroes = [
  { name: "a", alive: true, hp: 10 },
  { name: "b", alive: false, hp: 20 },
  { name: "c", alive: true, hp: 30 }
]
fn alive_hp() -> int =
  heroes
    |> filter(.alive) |> as living
    |> map(.hp)
    |> sum
@test "pipeline computes" { alive_hp() == 40 }
`,
    expected: '1 test passes',
    check: expectTests(1, 0),
  },
  {
    name: 'typed-let-annotation',
    description: 'Type-annotated let binding `let x: Health = 200` (natural way to use a constrained type on a value)',
    src: `
type Health = int where value >= 0 && value <= 100
let x: Health = 200
`,
    expected: 'parses (and ideally validates the constraint)',
    check(c) {
      if (c.parseErrors) {
        return { ok: false, actual: `parse error: ${c.parseErrors[0]} — \`let name: Type = ...\` is not valid syntax at all` }
      }
      const r = runTests(c.js)
      if (!r.ran && /AxonConstraintError/.test(r.vmError)) return { ok: true, actual: 'constraint enforced on let binding' }
      return { ok: true, actual: 'parses but constraint not checked on binding', note: 'partial support' }
    },
  },
  {
    name: 'malformed-unclosed-brace',
    description: 'Function body with unclosed brace — parser must report errors, not crash or hang',
    src: `fn broken :: (a: int) -> int {\n  let x = a + 1\n  x\n`,
    expected: 'parse errors returned gracefully',
    malformed: true,
  },
  {
    name: 'malformed-bad-token',
    description: 'Illegal characters in expression position — lexer/parser must recover',
    src: `fn ok_fn(n: int) = n * 2\nlet z = 5 @@ ### $! 3\nfn after(n: int) = n + 1\n`,
    expected: 'parse errors returned gracefully',
    malformed: true,
  },
  {
    name: 'malformed-incomplete-match',
    description: 'match with a dangling arm and EOF mid-expression',
    src: `fn f(x: int) -> string =\n  match x {\n    | 1 =>\n`,
    expected: 'parse errors returned gracefully',
    malformed: true,
  },
  {
    name: 'malformed-unterminated-string',
    description: 'Unterminated string literal at EOF',
    src: `let s = "never closed\nlet t = 5\n`,
    expected: 'parse errors returned gracefully',
    malformed: true,
  },
]

function expectTests(passed, failed) {
  return function check(c) {
    if (c.parseErrors) return { ok: false, actual: `parse errors: ${c.parseErrors.join('; ').slice(0, 150)}` }
    if (!c.js) return { ok: false, actual: `compile threw: ${c.threw}` }
    const r = runTests(c.js)
    if (!r.ran) return { ok: false, actual: `vm error: ${r.vmError.slice(0, 150)}` }
    const t = r.testResult
    const ok = t && t.passed === passed && t.failed === failed
    return {
      ok,
      actual: ok
        ? `${t.passed} passed, ${t.failed} failed`
        : `expected ${passed}p/${failed}f, got ${JSON.stringify(t && { passed: t.passed, failed: t.failed, results: t.results.filter((x) => !x.ok) })}`,
    }
  }
}

console.log('── Task 3: adversarial cases ────────────────────────────────')
const adversarial = []
for (const tc of CASES) {
  let record
  if (tc.malformed) {
    const r = parseInChild(tc.src)
    let ok, actual
    if (r.hung) {
      ok = false
      actual = `HANG/CRASH: ${r.detail}`
    } else if (r.threw) {
      ok = false
      actual = `parser THREW uncaught: ${r.message}`
    } else if (r.errorCount > 0) {
      ok = true
      actual = `${r.errorCount} parse error(s) reported gracefully, e.g. "${r.messages[0]}"`
    } else {
      ok = false
      actual = 'parser reported ZERO errors for malformed input'
    }
    record = { name: tc.name, description: tc.description, compiled: false, ran: false, expected: tc.expected, actual, ok }
  } else {
    const c = compile(tc.src)
    const res = tc.check(c)
    record = {
      name: tc.name,
      description: tc.description,
      compiled: !!c.js,
      ran: !!c.js && runTests(c.js).ran,
      expected: tc.expected,
      actual: res.actual,
      ok: res.ok,
    }
    if (res.note) record.note = res.note
  }
  adversarial.push(record)
  console.log(`  ${record.ok ? '✓' : '✗'} ${tc.name}: ${record.actual}`)
  if (!record.ok) findings.push(`[adversarial] ${tc.name}: expected ${record.expected}; actual: ${record.actual}`)
}

const adversarialOk = adversarial.filter((a) => a.ok).length
console.log(`  ${adversarialOk}/${adversarial.length} behaved as expected\n`)

// ── Task 4: v0.8 feature coverage (async, store, on...change) ────────────────

console.log('── Task 4: v0.8 feature coverage ────────────────────────────')
const v08Coverage = { chronicleCompiles: false, pureHelpersOk: false, notes: [] }
{
  const chroniclePath = path.join(ROOT, 'examples/chronicle/main.axn')
  const chronicleSrc = fs.readFileSync(chroniclePath, 'utf8')
  const cc = compile(chronicleSrc)
  v08Coverage.chronicleCompiles = !!cc.js && !cc.parseErrors
  v08Coverage.chronicleDiagnostics = cc.diagnostics.length
  if (!v08Coverage.chronicleCompiles) {
    findings.push(`v0.8: chronicle/main.axn failed to compile: ${cc.parseErrors || cc.threw}`)
  } else {
    v08Coverage.notes.push('chronicle/main.axn transpiles (store, async fn, on...change syntax accepted)')
  }

  // Pure helpers from chronicle — testable without DOM/store runtime.
  const helperSrc = `
@pure fn season_for(day: int) -> string {
  let idx = Math.floor(day / 91) % 4
  if idx == 0 { "spring" }
  else if idx == 1 { "summer" }
  else if idx == 2 { "autumn" }
  else { "winter" }
}
@pure fn weather_for(day: int, season: string) -> string {
  let seed = (day * 2654435761 + 7) % 100
  match season {
    | "winter" => seed < 45 ? "snow"    : seed < 75 ? "frost"   : "blizzard"
    | "summer" => seed < 50 ? "clear"   : seed < 80 ? "haze"    : "drought"
    | _        => "clear"
  }
}
@test "season day 1" { season_for(1) === "spring" }
@test "weather winter" { weather_for(1, "winter").length > 0 }
`
  const hc = compile(helperSrc)
  if (hc.js) {
    const r = runTests(hc.js)
    v08Coverage.pureHelpersOk = r.ran && r.testResult && r.testResult.failed === 0
    if (!v08Coverage.pureHelpersOk) findings.push('v0.8: chronicle pure helpers failed @tests in vm')
  }
  console.log(`  chronicle compiles: ${v08Coverage.chronicleCompiles} (${v08Coverage.chronicleDiagnostics} checker diagnostics)`)
  console.log(`  pure helpers ok:    ${v08Coverage.pureHelpersOk}\n`)
}

// ── Task 5: error-message quality ────────────────────────────────────────────

console.log('── Task 5: error-message quality ────────────────────────────')
const ERROR_PROBES = [
  {
    name: 'unknown-type-param',
    src: 'fn f<T>(x: T) -> int { x }\nlet y: NotAType = 1\n',
    want: /line|unknown|not/i,
  },
  {
    name: 'bad-match-arm',
    src: 'fn f(x: int) -> string = match x { | "hi" => "x" }\n',
    want: /line|type|match|int/i,
  },
  {
    name: 'missing-semantics',
    src: 'fn g() -> void { console.log("hi") }\n',
    want: /pure|effect|line/i,
  },
]

const errorQuality = { probes: ERROR_PROBES.length, actionable: 0, details: [] }
for (const probe of ERROR_PROBES) {
  const c = compile(probe.src)
  const messages = [
    ...(c.parseErrors || []),
    ...(c.diagnostics || []).map((d) => `[line ${d.line}] ${d.message}`),
    c.threw || '',
  ].join('\n')
  const actionable = probe.want.test(messages) && (/line\s+\d+/i.test(messages) || /\[line \d+\]/.test(messages))
  if (actionable) errorQuality.actionable++
  errorQuality.details.push({ name: probe.name, actionable, sample: messages.split('\n').filter(Boolean).slice(0, 2).join(' | ') })
  console.log(`  ${actionable ? '✓' : '✗'} ${probe.name}: ${messages.split('\n')[0]?.slice(0, 80) || '(no output)'}`)
}
// Malformed-input cases from Task 3 also count toward error quality.
const malformedOk = adversarial.filter((a) => a.name.startsWith('malformed-') && a.ok).length
const malformedTotal = adversarial.filter((a) => a.name.startsWith('malformed-')).length
errorQuality.malformedGraceful = `${malformedOk}/${malformedTotal}`
console.log(`  malformed graceful recovery: ${errorQuality.malformedGraceful}`)
console.log(`  actionable diagnostics: ${errorQuality.actionable}/${errorQuality.probes}\n`)

// ── Task 6: JS interop + debuggability smoke ─────────────────────────────────

console.log('── Task 6: JS interop & debuggability ───────────────────────')
const interop = { usesJsBuiltins: false, constraintErrorInVm: false, stackMentionsAxn: false, notes: [] }

{
  const src = `
fn sqrt_sum(a: float, b: float) -> float {
  @pure
  Math.sqrt(a * a + b * b)
}
@test "uses Math" { sqrt_sum(3.0, 4.0) === 5.0 }
`
  const c = compile(src)
  interop.usesJsBuiltins = !!(c.js && /Math\.sqrt/.test(c.js))
  if (c.js) {
    const r = runTests(c.js)
    interop.usesJsBuiltins = interop.usesJsBuiltins && r.ran && r.testResult && r.testResult.passed === 1
  }

  const constraintSrc = `
type Pos = int where value >= 0
fn f(x: Pos) -> int { x }
let y = f(-1)
`
  const cc = compile(constraintSrc)
  if (cc.js) {
    try {
      harness.runInVm(cc.js)
    } catch (e) {
      interop.constraintErrorInVm = /AxonConstraintError/.test(String(e))
      interop.stackMentionsAxn = /\.axn/i.test(String(e.stack || e))
    }
  }
  interop.notes.push(
    interop.stackMentionsAxn
      ? 'stack trace references .axn (unexpected without source maps)'
      : 'runtime errors surface as generated JS (no .axn in stack — source maps not yet available)'
  )
}
console.log(`  JS builtins + @test in vm: ${interop.usesJsBuiltins}`)
console.log(`  constraint error in vm:    ${interop.constraintErrorInVm}`)
console.log(`  stack mentions .axn:       ${interop.stackMentionsAxn}\n`)

// ── Write results ─────────────────────────────────────────────────────────────

const result = {
  summary: {
    exampleFilesRun: exampleResults.length,
    totalAssertions,
    totalPassed,
    totalFailed,
    adversarialCases: adversarial.length,
    adversarialExpectedBehavior: adversarialOk,
  },
  exampleResults,
  bundleReproducible,
  bundleNote,
  adversarial,
  v08Coverage,
  errorQuality,
  interop,
  findings,
}

const file = harness.writeResult('track-a-correctness', result)
console.log('── Summary ──────────────────────────────────────────────────')
console.log(`  Example assertions : ${totalPassed}/${totalAssertions} passed (${totalFailed} failed) across ${exampleResults.length} files`)
console.log(`  Bundle reproducible: ${bundleReproducible}`)
console.log(`  Adversarial        : ${adversarialOk}/${adversarial.length} as expected`)
console.log(`  Findings           : ${findings.length}`)
for (const f of findings) console.log(`    • ${f}`)
console.log(`\n  Results written to ${path.relative(ROOT, file)}`)
