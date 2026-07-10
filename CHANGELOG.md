# Synth Changelog

## v1.0.2 — Compiler patches

### Bug fixes

- **Object spread codegen** — `{ ...obj }` now emits real JavaScript spread instead of a broken `_spread_` shape (Neon Drift and other demos keep record fields).
- **Zero-arg method calls** — generated calls no longer include a trailing comma after empty argument lists (fixes empty Controls widgets / `$flat(...)`).
- **Constraint validators** — `type T = … where …` emits `__validate_T` helpers and injects param guards for constrained parameter types.

### Demo / site

- Shared landing site footer across demo pages.
- Load `synth.stdlib.js` before Combat, Music, and RPG compiled output.

## v0.9.9 — Ergonomics & DX

### New language features

**Spread operator**

`...` works in array literals, object literals, and function arguments:

```synth
let a = [1, 2, 3]
let b = [0, ...a, 4]          // [0, 1, 2, 3, 4]

let base = { x: 0, y: 0 }
let moved = { ...base, x: 5 } // { x: 5, y: 0 }

fn log_all(...items) = items |> join(", ") |> print
```

Rest parameters (`...name`) in short-form functions now work identically to the `::` form.

**Object shorthand**

When a property name matches a local variable name, the `: value` may be omitted:

```synth
let x = 10
let y = 20
let pt = { x, y }   // same as { x: x, y: y }
```

**Stdlib as method syntax**

All Synth stdlib functions whose first argument is a value can be called with dot syntax. The compiler rewrites `value.fn(args)` to `fn(value, args)`:

```synth
"  hello  ".trim()                  // trim("  hello  ")
"a,b,c".split(",")                  // split("a,b,c", ",")
"hello".to_upper()                  // to_upper("hello")
[5, 3, 8].filter(n => n > 4)        // filter([5,3,8], n => n > 4)
[1, 2, 3].sum()                     // sum([1,2,3])
[1, 2, 3].map(x => x * 2)          // map([1,2,3], x => x * 2)
scores.sort_by(s => s.value)        // sort_by(scores, s => s.value)
result.unwrap()                     // unwrap(result)
```

All string, array, and Result stdlib functions are supported as method calls. Native JS methods (`.toUpperCase()`, `.indexOf()`, etc.) continue to work unchanged.

**`do` notation**

`do { }` is a block expression — a sequenced computation in expression position. The last expression in the block is the result:

```synth
let total = do {
  let a = compute_base()
  let b = get_bonus()
  a + b
}
```

When the block contains `await`, it automatically becomes an async IIFE:

```synth
let data = do {
  let raw = await fetch_data(url)
  let parsed = await parse(raw)
  parsed
}
// emits: (async () => { ... })()
```

### Compiler & tooling

- **`print()` is now a compiler intrinsic** — `print(x)` compiles directly to `console.log(x)`. No stdlib dependency.
- **Stdlib separated** — `synth.stdlib.js` is a standalone file loaded once; compiled output contains only user code (84% fewer output tokens for small programs).
- **Compiled output is clean** — no JSDoc comments, no wrapper blocks; the transpiled JS pane shows exactly what was written.
- **CI: self-retrying deploy** — GitHub Pages deploy retries up to 3× automatically, eliminating transient failures.

---

## v0.9.8 — Control Flow

### New language features

**`while` loops**

Synth now supports `while` loops for condition-driven iteration:

```synth
let mut n = 1
while n <= 5 {
  console.log(n)
  n += 1
}
```

**`break` and `continue`** already existed for `for` loops and now work identically inside `while` loops:

```synth
let mut i = 0
while true {
  i += 1
  if i % 2 == 0 { continue }
  if i > 9 { break }
  console.log(i)   // 1 3 5 7 9
}
```

`break` exits the loop immediately. `continue` skips to the next iteration check.

---

## v0.9.7 — Standard Library Expansion

### New stdlib functions

**String**

| Function | Signature | Description |
|---|---|---|
| `trim` | `(s: string) -> string` | Strip leading/trailing whitespace |
| `split` | `(s: string, sep: string) -> string[]` | Split on separator |
| `starts_with` | `(s: string, prefix: string) -> bool` | Prefix check |
| `ends_with` | `(s: string, suffix: string) -> bool` | Suffix check |
| `contains` | `(s: string, sub: string) -> bool` | Substring/element check |
| `to_upper` | `(s: string) -> string` | Uppercase |
| `to_lower` | `(s: string) -> string` | Lowercase |
| `replace_all` | `(s: string, from: string, to: string) -> string` | Replace every occurrence |
| `pad_start` | `(s: string, len: int, char?: string) -> string` | Left-pad to length |
| `pad_end` | `(s: string, len: int, char?: string) -> string` | Right-pad to length |

**Array**

| Function | Signature | Description |
|---|---|---|
| `min` | `(xs: T[]) -> T` | Smallest value |
| `max` | `(xs: T[]) -> T` | Largest value |
| `min_by` | `(xs: T[], fn: T -> U) -> T` | Element with smallest key |
| `max_by` | `(xs: T[], fn: T -> U) -> T` | Element with largest key |
| `take` | `(xs: T[], n: int) -> T[]` | First n elements |
| `drop` | `(xs: T[], n: int) -> T[]` | Skip first n elements |
| `uniq` | `(xs: T[]) -> T[]` | Remove duplicates |
| `chunk` | `(xs: T[], n: int) -> T[][]` | Split into groups of n |
| `flat_map` | `(xs: T[], fn: T -> U[]) -> U[]` | Map then flatten |
| `set_at` | `(xs: T[], i: int, v: T) -> T[]` | Immutable index update |
| `reverse` | `(xs: T[]) -> T[]` | Reverse without mutation |
| `sum_by` | `(xs: T[], fn: T -> number) -> number` | Sum a numeric projection |

**Math**

| Function | Signature | Description |
|---|---|---|
| `clamp` | `(x, lo, hi) -> number` | Clamp to range [lo, hi] |
| `abs` | `(x: number) -> number` | Absolute value |
| `round` | `(x: number) -> int` | Round to nearest int |
| `floor` | `(x: number) -> int` | Round down |
| `ceil` | `(x: number) -> int` | Round up |
| `pow` | `(x, exp: number) -> number` | Exponentiation |
| `sqrt` | `(x: number) -> number` | Square root |
| `random` | `() -> float` | Random float in [0, 1) |
| `random_int` | `(lo, hi: int) -> int` | Random int in [lo, hi] |

---

## v0.9.6 — Compound Assignment

### New language features

- **Compound assignment operators** — `+=`, `-=`, `*=`, `/=`, `%=`, `??=` are now fully supported for `let mut` variables, object fields, and array elements.
  ```synth
  let mut score = 0
  score += 10
  score *= 2
  score -= 5
  console.log(score)  // 15

  let mut tag = null
  tag ??= "untagged"  // only assigns if null/undefined
  ```
  All six operators compile to their direct JavaScript equivalents with no overhead.

### Keyword aliases

- **`and` / `or` / `not`** — English-word aliases for `&&`, `||`, `!` are now recognised everywhere, including constraint expressions.
  ```synth
  type Score = int where value >= 0 and value <= 100
  fn valid(x: int) = x > 0 and x < 1000
  ```

### Bug fixes

- `record` declarations now emit a positional constructor factory so `Record(a, b)` works at runtime.
- User code is wrapped in a block scope to prevent naming conflicts with stdlib helpers (`count`, `map`, etc.).
- `sort_by` and `sort_by_desc` added to stdlib.
- Fixed `Object.prototype` pollution bug where property names like `toString`, `toLocaleString`, `valueOf` were incorrectly classified as keywords.
- `and` / `or` keyword aliases now correctly transpile to `&&` / `||` in generated JS.

---

## v0.9.5 — The Ergonomics Update

### New language features

- **`enum` type** — concise value-set declarations that compile to frozen, string-keyed objects.
  ```synth
  enum Status = Active | Paused | Done
  enum Priority = Low | Medium | High | Critical

  // Generated JS:
  // const Status = Object.freeze({ Active: 'Active', Paused: 'Paused', Done: 'Done' });
  ```
  Enum variants can be pattern-matched with the `Enum.Variant` syntax:
  ```synth
  fn describe(s: Status) = match s {
    | Status.Active => "running"
    | Status.Paused => "paused"
    | Status.Done   => "finished"
  }
  ```

- **Numeric separators** — `_` may appear anywhere inside a decimal, hex, or binary literal for readability. Separators are stripped at compile time; the output value is unaffected.
  ```synth
  let population  = 8_000_000_000
  let red_channel = 0xFF_00_00
  let flags       = 0b1010_1010
  let pi          = 3.141_592_653
  ```

- **Hex and binary literals** — `0x…` and `0b…` prefix literals are now fully supported in the lexer and preserve their notation in generated JS output.

- **Multi-line lambdas** — lambda bodies may be a block expression `{ … }` with multiple statements. The last expression is implicitly returned.
  ```synth
  let active =
    items
      |> filter(item => {
        let ok = item.status == Status.Active
        ok && item.priority != Priority.Low
      })
      |> map(item => {
        let label = "[" + item.status + "] " + item.title
        label
      })
  ```
  *(Block-body lambdas already compiled in v0.9.0; `parseLambdaBody` handled `{ … }` since v0.5. This entry formally documents the feature.)*

### Improved error reporting

- **Multi-error reporting** — the parser now collects all errors with panic-mode recovery instead of stopping at the first error. `parse()` returns `{ ast, errors }`. The browser bundle's `SynthCompiler.compile()` API is updated accordingly.
  ```js
  const { js, errors, warnings } = SynthCompiler.compile(source)
  // errors — array of { message, line, col, kind } — may contain multiple items
  ```

### Tooling

- All v0.9 CLI commands (`--check`, `--fmt`, `--watch`) are included and stable.
- `synth.compiler.js` browser bundle updated to v0.9.5; version string is `"0.9.5"`.

---

## v0.9.0 — The Developer Experience Update

### New tooling

- **`synth --check <file>`** — static analysis only; no JS emitted. Reports checker warnings and parse errors without writing any output file.
  ```
  synth --check src/main.syn
  ✓  main.syn — no issues
  ```

- **`synth --fmt <file> [--write]`** — canonical formatter. Normalizes indentation (2 spaces), spacing around operators, brace padding, and trailing whitespace. `--write` rewrites the file in-place; without it, the formatted source is written to stdout.
  ```
  synth --fmt src/main.syn --write
  ✓  main.syn — formatted
  ```
  **Known limitation (v0.9.0):** `<` and `>` are left without spaces to preserve generic type parameters such as `List<T>`. Comparison operators like `x > 0` are unaffected but not space-normalized.

- **`synth --watch <file> [output.js]`** — file watcher. Recompiles automatically whenever the source file changes. Ctrl+C to stop.
  ```
  synth --watch src/main.syn dist/main.js
  [12:34:01]  ✓  main.syn → main.js
  Watching main.syn for changes… (Ctrl+C to stop)
  ```

### New compiler API

- **Structured error objects** — `compile()` in the browser bundle returns `{ js, errors, warnings }` instead of throwing. Errors carry `{ message, line, col, kind }`.

- **`synth.compiler.js`** — browser-compatible IIFE bundle (`demo/synth.compiler.js`). Load it in any web page to get the full Synth compiler running client-side:
  ```html
  <script src="synth.compiler.js"></script>
  <script>
    const { js, errors, warnings } = SynthCompiler.compile(source);
    // errors[] → [{ message, line, col, kind }]
    // warnings[] → [{ severity, message, line, col }]
  </script>
  ```

### New demo

- **Synth Playground** (`playground.html`) — live in-browser IDE featuring:
  - Split-pane editor with line numbers and cursor position tracking
  - Real-time transpilation (auto-compile as you type)
  - Transpiled JS tab with basic syntax highlighting
  - Live Result tab — runs the transpiled code in a sandboxed `new Function()` context and captures all `console.log` output
  - Format button (normalizes source)
  - 10 preloaded example programs covering all language features
  - Full keyboard support: Tab for 2-space indents, Ctrl+Enter to run

---

## v0.8.0 — The Async & Reactive Update

### New language features

- **`async fn`** — asynchronous function declarations that transpile to `async` arrow functions
  ```synth
  @effects ["timer"]
  async fn fetch_data(url: string) -> Result<string> {
    let r = await delay(0)
    ok("data")
  }
  ```

- **`await expr`** — resolves a Promise inside an `async fn`; valid at statement or expression level
  ```synth
  async fn tick() {
    await delay(500)          // stdlib helper: delay(ms) returns Promise<void>
    await fetch_quests()      // any Promise expression
  }
  ```

- **`store Name { field: Type = default }`** — reactive mutable state as an explicit effects boundary. Compiles to a self-contained IIFE with getters, `set(patch)`, and `subscribe(fn)`.
  ```synth
  store Kingdom {
    day:    int    = 1
    season: string = "spring"
    events: list<string> = []
  }
  // Access: Kingdom.day, Kingdom.season
  // Mutate: Kingdom.set({ day: 2, season: "summer" })
  ```

- **`on StoreName.change { body }`** — reactive subscription sugar. Desugars to `StoreName.subscribe(() => { body })`. The callback fires once immediately on subscribe, then after every `.set()` call.
  ```synth
  on Kingdom.change { render() }
  // equivalent to: Kingdom.subscribe(() => { render() })
  ```

- **`@effects ["timer"]` enforcement** — the static checker now warns when an `async fn` is declared without an `@effects` annotation, keeping async side-effects visible in the type signatures.

### Stdlib additions

- `delay(ms)` — returns `Promise<void>` that resolves after `ms` milliseconds. Use with `await` inside `async fn`.

### Parser improvements

- Bare `return` (no value) is now valid inside function bodies and if-blocks; emits `return undefined`.

### Demo

- **Chronicle** — a reactive fantasy kingdom event log. Uses `store`, `async fn tick()`, `await delay()`, and `on Kingdom.change { render() }` to drive a live-updating UI entirely from Synth source.

---

## v0.7.0 — The Type System Update

### New language features

- **Generic type parameters** on `fn`, `record`, and `type` declarations
  ```synth
  record Pair<A, B> { first: A; second: B }
  fn map<T, U>(items: T[], f: fn(T) -> U) -> U[] = items.map(f)
  type Maybe<T> = | Some { value: T } | None
  ```

- **`interface` declarations** — structural type contracts (type-level only, erased to JSDoc)
  ```synth
  interface Tradeable {
    name:     string
    price:    int
    describe: fn() -> string
  }
  ```

- **`fn(T) -> U` type expressions** — first-class function types in signatures and interfaces
  ```synth
  fn apply<T, U>(value: T, f: fn(T) -> U) -> U = f(value)
  ```

- **`let infer`** — model-resolved type annotation; signals to AI tooling that the type should be inferred from context rather than explicitly declared
  ```synth
  fn compute(names: string[]) -> int[] {
    let infer scores = map(names, s => s.length)
    scores
  }
  ```

### Demo: The Bazaar

New fully interactive RPG item shop demo (`demo/bazaar.html`) showcasing all v0.7 features:
- 20 typed items across 5 categories and 5 rarity tiers
- Generic `keep_if<T>`, `transform<T,U>`, `order_by<T>`, `total<T>` helpers
- `interface Tradeable` and `interface Filterable<T>` structural contracts
- `let infer` throughout the filter/sort pipeline in `apply_filters`
- Immutable `AppState` record with full filter, sort, search, and cart UI

### Compiler changes

- **Lexer**: new keywords `interface`, `infer`
- **Parser**: `<T, U>` type param lists on `fn`/`record`/`type`; `interface` top-level declarations; `fn(T) -> U` function type expressions; `let infer` bindings
- **Codegen**: generics are erased to JS (runtime-transparent); `interface` emits as JSDoc `@interface` comment; `let infer` compiles identically to `let`
- **Checker**: `InterfaceDecl` walked during analysis; registered in top-level pass

---

## v0.6.0 — The Safety Update

### New language features

- **`Result` type + stdlib helpers**
  `ok(value)` / `err(message)` constructors. `is_ok`, `is_err`, `unwrap`, `unwrap_or`
  available in every Synth program.

  ```synth
  let r = ok(42)         // { tag: "Ok", value: 42 }
  let e = err("oops")    // { tag: "Err", message: "oops" }
  ```

- **`?` propagation operator**
  `let n = parse(s)?` — if `parse(s)` returns `Err`, the enclosing function
  returns immediately with that error. If `Ok`, unwraps the value into `n`.
  Line-aware disambiguation from ternary `?:` — `?` on its own line is always
  propagation.

  ```synth
  @throws
  fn process(input: string) -> any {
    let n = parse_int(input)?   // propagates Err, unwraps Ok
    ok(n * 2)
  }
  ```

- **`@throws` annotation**
  Marks a function as one that returns `Result`. The checker emits a warning
  if a `@throws` function never calls `ok()` or `err()`. Pre-function syntax
  (`@throws fn foo()`) is now supported alongside the existing inside-body form.

- **`refine x: "semantic claim"`**
  Documents an invariant about a value inline. Emitted as a structured comment
  in JS today; becomes model-checkable in v1.0 via `synth spec`.

  ```synth
  let seed = Math.abs(n) % 2147483648
  refine seed: "a non-negative dungeon seed in [0, 2^31)"
  ```

- **Pattern matching on `Result`**
  `Ok` and `Err` work as tagged union patterns in `match` out of the box.

  ```synth
  match parse_config(input) {
    | Ok  { value }   => render(value)
    | Err { message } => show_error(message)
  }
  ```

### Demo: Dungeon Configurator

New `config.syn` module — parses `level:seed` codes with three chained
`@throws` functions. Every field failure produces a precise error message
rather than a generic crash. The seed code input in the dungeon demo
auto-syncs to the current state and validates on Enter or button click.

### Tests

17 new `@test` cases in `examples/v06_features.syn`.
9 new `@test` cases in `examples/dungeon/config.syn`.
85 total tests across all example files, all passing.

---

## v0.5.2 — The Ergonomics Update

### New language features

- **`for i in lo..hi { body }` — exclusive range loop**
  Compiles to a native JS `for (let i = lo; i < hi; i++)` loop.
  No more `Array.from({ length: n }).forEach((_, i) => ...)` boilerplate.

- **`for i in lo..=hi { body }` — inclusive range loop**
  Compiles to `for (let i = lo; i <= hi; i++)`.

- **`for x in array { body }` — forEach loop**
  Iterates over any array or iterable. Compiles to `for (const x of array)`.

- **`break` and `continue`**
  Exit or skip iterations inside any `for` body. Work across nested loops.

  ```synth
  for i in 0..100 {
    if i == 5 { break }    // exit loop
  }
  for i in 0..10 {
    if i % 2 != 0 { continue }   // skip odds
    process(i)
  }
  ```

- **`let mut x = val` — explicit mutable binding**
  Plain `let` signals immutable intent. `let mut` opts into reassignment.
  The compiler distinction prepares for full enforcement in v0.6.

  ```synth
  let     x = 5        // immutable by intent
  let mut n = 0        // explicitly mutable
  n = n + 1            // valid — n is mut
  ```

### Compiler fixes

- **Lexer: `..` and `..=` range tokens** — `DOTDOT` and `DOTDOTEQ` tokens added.
  The number literal reader was fixed to stop consuming `.` greedily (it
  previously lexed `0..5` as number `0..` followed by `5`).

- **Parser: `stmtMode` propagation** — `if` blocks nested inside `for` bodies
  now correctly emit their last expression as a statement rather than
  `return`, which would have exited the enclosing function early.

### Demo rewrite

- **`generator.syn`** — all `Array.from().forEach` patterns replaced with
  `for` loops; all accumulator variables use `let mut`; `count_tag` uses
  `for row in grid { for cell in row { } }`.

### Tests

- **`examples/v052_features.syn`** — 8 new `@test` declarations covering all
  new constructs: exclusive range, inclusive range, `for...in`, `break`,
  `continue`, `let mut`, nested loops, and object iteration.

---

## v0.5.1

Patch release fixing compiler correctness bugs that made entry-point files fail silently,
plus a major overhaul of the Dungeon Map Toolkit demo and a new torch placement rule.

### Compiler

- **`TopLevelLet` AST node** — top-level `let x = …` bindings now parse and emit correctly.
  Previously the parser silently dropped them, breaking any entry file with a top-level
  `let state = {…}` declaration.
- **`TopLevelExpr` AST node** — bare expression statements at top level (e.g. `mount()`)
  now parse and emit correctly. Previously also silently dropped.
- **Bundler output path fix** — `synth --bundle` now correctly treats the second positional
  argument as the output path; previously the output could be written to a literal file
  named `-o`.
- **Stdlib emitted once in bundles** — added `emitStdlib` flag to codegen so multi-module
  bundles never duplicate the stdlib header, eliminating
  `SyntaxError: Identifier 'map' has already been declared`.

### Dungeon demo — generator (`generator.syn`)

- **Room-based generator** — rewrote from scatter noise to a room-and-corridor
  approach: randomly placed rectangular rooms carved from an all-wall grid, connected
  by L-shaped corridors. Produces coherent dungeon layouts instead of uniform noise fields.
- **Avalanche hash (`cell_hash`)** — two-step hash with distinct prime multipliers and
  swapped roles for `r` / `c` in the second step, breaking row/column correlation. LCG
  input normalised with `% 2147483648` to prevent JS float overflow and eliminate
  Gantt-chart tile patterns.
- **Tile density tuning** — chest and water probabilities significantly reduced; chests are
  rare finds, water appears only occasionally.
- **Door placement** — doors removed from random scatter. New `place_room_doors` scans
  each room's four wall edges, places at most one door per edge (via `findIndex`), and
  only if the corridor cell is flanked by walls on both perpendicular sides — a single-tile
  bottleneck entrance, never a row of doors.
- **Torch placement** — torches removed from random scatter. New `place_door_torches`
  places a torch at each open floor diagonal of every door, like wall sconces bracketing
  the entrance. A `@test` enforces the invariant: every torch must be diagonally adjacent
  to a door.

### Dungeon demo — state pattern (`main.syn`)

- **Immutable `AppState` record** — replaced the mutable JS object `state` with an
  `AppState` record. `render(s: AppState)` draws the dungeon and re-wires every button
  `onclick` with a fresh closure over the *next* state value. No variable is ever mutated;
  state flows through the call chain as data. This is the idiomatic Synth pattern until
  v0.8 ships `store`:
  ```synth
  store AppState { level: int = 1, seed: int = 7777 }
  on AppState.change { render(AppState) }
  ```

---

## v0.5.0 — The Module Update

### New features

- **`import { ... } from "./path"` — multi-file modules**
  Split a project across multiple `.syn` files. Named imports resolve relative
  to the importing file and are bundled by the CLI:

  ```synth
  import { generate, count_tag } from "./generator"
  import { render_map, render_legend } from "./renderer"
  ```

- **`export fn / export type / export record` — public API surface**
  Mark any top-level declaration as exported. The bundler treats all exported
  symbols as part of the module's public interface:

  ```synth
  export type Tile = | Floor | Wall | Door | Stairs | Chest | Water | Torch
  export fn generate(rows: int, cols: int, level: int, seed: int) -> DungeonMap = ...
  ```

- **`synth --bundle <entry.syn> [out.js]` — multi-file bundler**
  Recursively resolves all imports starting from an entry file, topologically
  sorts modules (dependencies before dependents), and concatenates to a single
  JS output. The stdlib is emitted once at the top of the bundle.

  ```bash
  synth --bundle examples/dungeon/main.syn demo/dungeon.sources.js
  # ✓ Bundled tiles.syn + generator.syn + renderer.syn + main.syn → dungeon.sources.js
  #   4 modules → 407 lines JS
  ```

- **`--test` auto-bundle** — when `--test` is run on a file that contains imports,
  the test runner automatically bundles the dependency graph first, so all
  imported symbols are available during `@test` execution.

### Parser improvements

- **Optional parentheses on `if` statements** — both `if (cond) { }` and
  `if cond { }` are now valid.

- **Return-type annotation on short-form functions** — `fn f(x) -> T = expr`
  is now valid alongside the existing `fn f(x) = expr` and the full
  `fn f :: (params) -> T { body }` forms.

- **Block-body short-form functions** — `fn f(params) -> T { block }` is now
  parsed as a short-form function with a block body.

- **Nested `fn` declarations in block bodies** — a `fn` statement inside a
  block is parsed and emitted as a `let` binding to a lambda.

### Demo

- **Dungeon Map Toolkit** — four-file demo introducing Synth modules:
  - `tiles.syn` — `export type Tile` tagged union, glyph/label helpers, 5 `@test`s
  - `generator.syn` — procedural map generator, `@test`s
  - `renderer.syn` — HTML colour-span renderer, legend and stats bar
  - `main.syn` — imports from all three, DOM wiring, level names with `when` guards

---

## v0.4.0

### New features

- **`when` guards in `match`** — any match arm can carry a boolean guard clause. Guards have full
  access to binding names introduced by the pattern:
  ```synth
  match score {
    | n when n >= 90 => "A"
    | n when n >= 80 => "B"
    | _              => "F"
  }
  // Emits: ((_m) => ((n) => n >= 90 ? "A" : ((n) => n >= 80 ? "B" : "F")(_m))(_m))(score)
  ```
  Tagged union patterns with guards destructure fields before running the guard:
  ```synth
  | Circle { r } when r > 10 => "big circle"
  ```

- **`?.` optional chaining** — safe member access, index, and call on potentially-null values.
  Compiles to JS optional chaining directly:
  ```synth
  hero.weapon?.name ?? "bare hands"
  hero.guild?.rank ?? hero.guild?.name ?? "freelancer"
  arr?.[0]
  callback?.()
  ```

- **`??` nullish coalescing** — returns the left side unless it is `null` or `undefined`, then
  returns the right side. Precedence: lower than `||`, higher than ternary:
  ```synth
  config.timeout ?? 5000
  user.displayName ?? user.email ?? "Guest"
  ```

- **Destructuring `let`** — unpack object and array values directly into named bindings. Supports
  rename syntax for objects:
  ```synth
  let { w, h }       = rect           // object destructure
  let { x: ax, y: ay } = pointA       // with rename
  let [first, second] = items         // array destructure
  let [_, second]    = pair           // skip first with _
  ```
  Particularly useful when consuming record-returning functions like `damage_breakdown`:
  ```synth
  let { atk, bonus, mitigation, isCrit, finalDmg } = damage_breakdown(str, def, eb, roll)
  ```

- **Triple-quote strings `"""..."""`** — multiline string literals that preserve literal newlines.
  Support the same `{ident}` interpolation as regular strings. A leading newline after `"""` is
  automatically stripped (idiomatic alignment):
  ```synth
  let msg = """
  In a land of eternal fog,
  welcome {name}!
  """
  ```
  Compiles to a JS template literal.

- **Tagged union types** — declare algebraic data types with named variants. Unit variants are
  frozen constants; payload variants are factory functions:
  ```synth
  type Shape =
    | Circle { r: float }
    | Rect   { w: float, h: float }
    | Point
  ```
  Emits:
  ```js
  const Circle = (r) => Object.freeze({ tag: "Circle", r })
  const Rect   = (w, h) => Object.freeze({ tag: "Rect", w, h })
  const Point  = Object.freeze({ tag: "Point" })
  ```
  Pattern-match with `TagPat` (variant name + braces) or bare capitalized identifier:
  ```synth
  match shape {
    | Circle { r }   => 3.14159 * r * r
    | Rect { w, h }  => w * h
    | Point          => 0.0
  }
  ```
  The `@exhaustive` checker verifies all variants are covered.

- **`@test` declarations** — top-level inline test definitions. Assertions are registered in
  `__synth_tests` at runtime and runnable via `__runSynthTests()` in the browser, or the new
  `--test` CLI flag in Node:
  ```synth
  @test "mage lv10 title"   { level_title("mage", 10) === "Archmage" }
  @test "element bonus"     { element_bonus("mage", "arcane") === 9 }
  ```
  CLI: `node dist/cli.js --test examples/rpg.syn` — runs all tests and exits with code 1 on failure.

- **Pipeline `|> as name`** — bind the current pipeline value to a named variable and continue the
  pipeline. When any `as` step appears, the pipeline emits as an IIFE block with `const` bindings,
  making intermediate results available for debugging or reuse:
  ```synth
  party
    |> filter(.alive) |> as alive
    |> map(.hp)
    |> sum
  ```
  Emits:
  ```js
  (() => {
    const alive = filter(party, __x => __x.alive);
    return sum(map(alive, __x => __x.hp));
  })()
  ```

### Language refinements

- **Binding patterns in `match`** — lowercase `IdentPat` patterns (e.g. `| n =>`) now correctly
  bind the subject to the name rather than comparing against a variable named `n`. Guards and
  bodies can reference the bound name freely.
- **`inMatchGuard` disambiguation** — bare `ident =>` lambda syntax is suppressed inside `when`
  guard expressions where `=>` is the match arm separator. Use `(ident) =>` for lambdas in guards.
- **Destructure rename syntax** — `let { key: alias } = obj` supported in destructuring `let`.

### Transpiler

- `Codegen.generate` version header updated to `v0.4.0`
- `Checker` updated to walk `when` guards, `DestructureStmt`, and `TaggedUnionDecl` variants
- `Stdlib` includes `__synth_tests` array and `__runSynthTests()` runner exposed on `globalThis`
- CLI `--test` flag executes tests via Node `vm` module and prints pass/fail summary

## v0.3.0

### New features

- **String interpolation** — `"Hello {name}, you have {count} items"` compiles to a JS template
  literal. Supports `{ident}` and `{ident.prop}` expressions inline in any string literal.
  No extra syntax — if a string contains `{name}`, it's an interpolated string automatically.

- **`.field` accessor shorthand** — `.fieldName` in any expression position creates an implicit
  lambda `__x => __x.fieldName`. Makes pipelines dramatically more concise:
  ```synth
  users |> filter(.active) |> map(.score) |> sum
  ```
  Chained access works too: `.user.name`.

- **Param validation injection** — functions whose parameters are typed with constrained types
  (types declared with `where`) now automatically emit guard clauses at function entry:
  ```synth
  fn send_welcome :: (email: EmailAddress) -> void { ... }
  // → if (!__validate_EmailAddress(email)) throw new Error(...)
  ```
  No manual calls needed. Constraints are enforced at the boundary, automatically.

- **`@memo` annotation** — `@pure @total` functions annotated with `@memo` are wrapped in a
  `Map`-based memoization cache at compile time. Recursive functions like `fib` become
  automatically memoized with zero runtime overhead per call after the first:
  ```synth
  fn fib :: (n: int) -> int {
    @pure @total @memo
    match n { | 0 => 0 | 1 => 1 | _ => fib(n-1) + fib(n-2) }
  }
  ```

### Improvements

- Transpiler now emits `// Synth v0.3.0` header
- `getParamValidations` is now fully implemented (was stubbed in v0.2)

---

## v0.2.0

### New features

- **Constraint enforcement** — `type T = base where expr` now generates a runtime validator
  function `__validate_T(value)`. Constrained types in function params emit validation calls
  at the top of the generated function body.
- **`@pure` checker** — functions annotated `@pure` are statically checked by the transpiler.
  Calls to known side-effectful globals (`document`, `window`, `console`, `fetch`, `setTimeout`,
  `localStorage`, `Math.random`) produce a compile-time warning.
- **`@exhaustive` checker** — `match` expressions inside `@exhaustive` functions are checked
  for coverage. Missing wildcard or missing boolean cases produce a warning.
- **Synth stdlib** — `synth:std` is auto-injected as a preamble. Provides: `map`, `filter`,
  `fold`, `pipe`, `zip`, `range`, `first`, `last`, `sum`, `count`, `any`, `all`, `flat`.
  All functions carry `@intent` and `@pure @total` annotations.
- **Short-form functions** — Single-expression functions no longer require a block body:
  ```synth
  fn double(x: int) = x * 2
  fn greet(name: string) = "Hello, " + name
  ```
  The `::` type-signature form still works for multi-line or annotated functions.

### Improvements

- Transpiler now emits `// Synth v0.2.0` header
- `@effects` annotation value is now joined as dot-notation strings (e.g. `dom.write`)
  rather than space-separated tokens
- Cleaner JSDoc output for record types

---

## v0.1.0

- Initial release: Lexer, Parser, Code Generator
- Type aliases, record types, function declarations
- Pipeline operator `|>`, pattern matching, let bindings
- `@intent`, `@pure`, `@total`, `@effects` annotations (metadata only)
- Web controls demo: counter, email validator, toggle, theme switcher, modal
