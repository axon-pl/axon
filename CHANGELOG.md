# Axon Changelog

## v0.6.0 — The Safety Update

### New language features

- **`Result` type + stdlib helpers**
  `ok(value)` / `err(message)` constructors. `is_ok`, `is_err`, `unwrap`, `unwrap_or`
  available in every Axon program.

  ```axon
  let r = ok(42)         // { tag: "Ok", value: 42 }
  let e = err("oops")    // { tag: "Err", message: "oops" }
  ```

- **`?` propagation operator**
  `let n = parse(s)?` — if `parse(s)` returns `Err`, the enclosing function
  returns immediately with that error. If `Ok`, unwraps the value into `n`.
  Line-aware disambiguation from ternary `?:` — `?` on its own line is always
  propagation.

  ```axon
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
  in JS today; becomes model-checkable in v1.0 via `axon spec`.

  ```axon
  let seed = Math.abs(n) % 2147483648
  refine seed: "a non-negative dungeon seed in [0, 2^31)"
  ```

- **Pattern matching on `Result`**
  `Ok` and `Err` work as tagged union patterns in `match` out of the box.

  ```axon
  match parse_config(input) {
    | Ok  { value }   => render(value)
    | Err { message } => show_error(message)
  }
  ```

### Demo: Dungeon Configurator

New `config.axn` module — parses `level:seed` codes with three chained
`@throws` functions. Every field failure produces a precise error message
rather than a generic crash. The seed code input in the dungeon demo
auto-syncs to the current state and validates on Enter or button click.

### Tests

17 new `@test` cases in `examples/v06_features.axn`.
9 new `@test` cases in `examples/dungeon/config.axn`.
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

  ```axon
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

  ```axon
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

- **`generator.axn`** — all `Array.from().forEach` patterns replaced with
  `for` loops; all accumulator variables use `let mut`; `count_tag` uses
  `for row in grid { for cell in row { } }`.

### Tests

- **`examples/v052_features.axn`** — 8 new `@test` declarations covering all
  new constructs: exclusive range, inclusive range, `for...in`, `break`,
  `continue`, `let mut`, nested loops, and object iteration.

---

## v0.5.1

### New features

- **`import { ... } from "./path"` — multi-file modules**
  Split a project across multiple `.axn` files. Named imports resolve relative
  to the importing file and are bundled by the CLI:

  ```axon
  import { generate, count_tag } from "./generator"
  import { render_map, render_legend } from "./renderer"
  ```

- **`export fn / export type / export record` — public API surface**
  Mark any top-level declaration as exported. The bundler treats all exported
  symbols as part of the module's public interface:

  ```axon
  export type Tile = | Floor | Wall | Door | Stairs | Chest | Water | Torch
  export fn generate(rows: int, cols: int, level: int, seed: int) -> DungeonMap = ...
  ```

- **`axon --bundle <entry.axn> [out.js]` — multi-file bundler**
  Recursively resolves all imports starting from an entry file, topologically
  sorts modules (dependencies before dependents), and concatenates to a single
  JS output. The stdlib is emitted once at the top of the bundle.

  ```bash
  axon --bundle examples/dungeon/main.axn demo/dungeon.sources.js
  # ✓ Bundled tiles.axn + generator.axn + renderer.axn + main.axn → dungeon.sources.js
  #   4 modules → 407 lines JS
  ```

- **`--test` auto-bundle** — when `--test` is run on a file that contains imports,
  the test runner automatically bundles the dependency graph first, so all
  imported symbols are available during `@test` execution.

### Parser improvements (also shipped in v0.5.0)

- **Optional parentheses on `if` statements** — both `if (cond) { }` and
  `if cond { }` are now valid. The RPG and all existing demos are unaffected.

- **Return-type annotation on short-form functions** — `fn f(x) -> T = expr`
  is now valid alongside the existing `fn f(x) = expr` and the full
  `fn f :: (params) -> T { body }` forms.

- **Block-body short-form functions** — `fn f(params) -> T { block }` is now
  parsed as a short-form function with a block body, removing the need to use
  the `::` sigil for simple named functions that need multiple statements.

- **Nested `fn` declarations in block bodies** — a `fn` statement inside a
  block is now parsed and emitted as a `let` binding to a lambda, enabling
  local helper functions inside larger functions.

### Demo

- **Dungeon Map Toolkit** — four-file demo introducing Axon modules:
  - `tiles.axn` — `export type Tile` tagged union, glyph/label helpers, 5 `@test`s
  - `generator.axn` — procedural map generator, `@test`s
  - `renderer.axn` — HTML colour-span renderer, legend and stats bar
  - `main.axn` — imports from all three, DOM wiring, level names with `when` guards

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
- **Bundler output path fix** — `axon --bundle` now correctly treats the second positional
  argument as the output path; previously the output could be written to a literal file
  named `-o`.
- **Stdlib emitted once in bundles** — added `emitStdlib` flag to codegen so multi-module
  bundles never duplicate the stdlib header, eliminating
  `SyntaxError: Identifier 'map' has already been declared`.

### Dungeon demo — generator (`generator.axn`)

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

### Dungeon demo — state pattern (`main.axn`)

- **Immutable `AppState` record** — replaced the mutable JS object `state` with an
  `AppState` record. `render(s: AppState)` draws the dungeon and re-wires every button
  `onclick` with a fresh closure over the *next* state value. No variable is ever mutated;
  state flows through the call chain as data. This is the idiomatic Axon pattern until
  v0.8 ships `store`:
  ```axon
  store AppState { level: int = 1, seed: int = 7777 }
  on AppState.change { render(AppState) }
  ```

---

## v0.4.0

### New features

- **`when` guards in `match`** — any match arm can carry a boolean guard clause. Guards have full
  access to binding names introduced by the pattern:
  ```axon
  match score {
    | n when n >= 90 => "A"
    | n when n >= 80 => "B"
    | _              => "F"
  }
  // Emits: ((_m) => ((n) => n >= 90 ? "A" : ((n) => n >= 80 ? "B" : "F")(_m))(_m))(score)
  ```
  Tagged union patterns with guards destructure fields before running the guard:
  ```axon
  | Circle { r } when r > 10 => "big circle"
  ```

- **`?.` optional chaining** — safe member access, index, and call on potentially-null values.
  Compiles to JS optional chaining directly:
  ```axon
  hero.weapon?.name ?? "bare hands"
  hero.guild?.rank ?? hero.guild?.name ?? "freelancer"
  arr?.[0]
  callback?.()
  ```

- **`??` nullish coalescing** — returns the left side unless it is `null` or `undefined`, then
  returns the right side. Precedence: lower than `||`, higher than ternary:
  ```axon
  config.timeout ?? 5000
  user.displayName ?? user.email ?? "Guest"
  ```

- **Destructuring `let`** — unpack object and array values directly into named bindings. Supports
  rename syntax for objects:
  ```axon
  let { w, h }       = rect           // object destructure
  let { x: ax, y: ay } = pointA       // with rename
  let [first, second] = items         // array destructure
  let [_, second]    = pair           // skip first with _
  ```
  Particularly useful when consuming record-returning functions like `damage_breakdown`:
  ```axon
  let { atk, bonus, mitigation, isCrit, finalDmg } = damage_breakdown(str, def, eb, roll)
  ```

- **Triple-quote strings `"""..."""`** — multiline string literals that preserve literal newlines.
  Support the same `{ident}` interpolation as regular strings. A leading newline after `"""` is
  automatically stripped (idiomatic alignment):
  ```axon
  let msg = """
  In a land of eternal fog,
  welcome {name}!
  """
  ```
  Compiles to a JS template literal.

- **Tagged union types** — declare algebraic data types with named variants. Unit variants are
  frozen constants; payload variants are factory functions:
  ```axon
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
  ```axon
  match shape {
    | Circle { r }   => 3.14159 * r * r
    | Rect { w, h }  => w * h
    | Point          => 0.0
  }
  ```
  The `@exhaustive` checker verifies all variants are covered.

- **`@test` declarations** — top-level inline test definitions. Assertions are registered in
  `__axon_tests` at runtime and runnable via `__runAxonTests()` in the browser, or the new
  `--test` CLI flag in Node:
  ```axon
  @test "mage lv10 title"   { level_title("mage", 10) === "Archmage" }
  @test "element bonus"     { element_bonus("mage", "arcane") === 9 }
  ```
  CLI: `node dist/cli.js --test examples/rpg.axn` — runs all tests and exits with code 1 on failure.

- **Pipeline `|> as name`** — bind the current pipeline value to a named variable and continue the
  pipeline. When any `as` step appears, the pipeline emits as an IIFE block with `const` bindings,
  making intermediate results available for debugging or reuse:
  ```axon
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
- `Stdlib` includes `__axon_tests` array and `__runAxonTests()` runner exposed on `globalThis`
- CLI `--test` flag executes tests via Node `vm` module and prints pass/fail summary

## v0.3.0

### New features

- **String interpolation** — `"Hello {name}, you have {count} items"` compiles to a JS template
  literal. Supports `{ident}` and `{ident.prop}` expressions inline in any string literal.
  No extra syntax — if a string contains `{name}`, it's an interpolated string automatically.

- **`.field` accessor shorthand** — `.fieldName` in any expression position creates an implicit
  lambda `__x => __x.fieldName`. Makes pipelines dramatically more concise:
  ```axon
  users |> filter(.active) |> map(.score) |> sum
  ```
  Chained access works too: `.user.name`.

- **Param validation injection** — functions whose parameters are typed with constrained types
  (types declared with `where`) now automatically emit guard clauses at function entry:
  ```axon
  fn send_welcome :: (email: EmailAddress) -> void { ... }
  // → if (!__validate_EmailAddress(email)) throw new Error(...)
  ```
  No manual calls needed. Constraints are enforced at the boundary, automatically.

- **`@memo` annotation** — `@pure @total` functions annotated with `@memo` are wrapped in a
  `Map`-based memoization cache at compile time. Recursive functions like `fib` become
  automatically memoized with zero runtime overhead per call after the first:
  ```axon
  fn fib :: (n: int) -> int {
    @pure @total @memo
    match n { | 0 => 0 | 1 => 1 | _ => fib(n-1) + fib(n-2) }
  }
  ```

### Improvements

- Transpiler now emits `// Axon v0.3.0` header
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
- **Axon stdlib** — `axon:std` is auto-injected as a preamble. Provides: `map`, `filter`,
  `fold`, `pipe`, `zip`, `range`, `first`, `last`, `sum`, `count`, `any`, `all`, `flat`.
  All functions carry `@intent` and `@pure @total` annotations.
- **Short-form functions** — Single-expression functions no longer require a block body:
  ```axon
  fn double(x: int) = x * 2
  fn greet(name: string) = "Hello, " + name
  ```
  The `::` type-signature form still works for multi-line or annotated functions.

### Improvements

- Transpiler now emits `// Axon v0.2.0` header
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
