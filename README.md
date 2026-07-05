# ⬡ Axon

**An AI-native programming language that transpiles to JavaScript.**

Axon is designed from the ground up to be written, read, and reasoned about by language models — with unambiguous grammar, intent-first declarations, constraint-enforced types, and explicit effect tracking. It compiles to clean, readable JavaScript with no runtime dependency.

```axon
type Health = int where value >= 0 && value <= 100

record Hero {
  name:   string
  hp:     Health
  level:  int
  alive:  bool
}

fn level_title :: (class: string, level: int) -> string {
  @pure @total
  @intent "Human-readable rank for a hero given class and level"
  match class {
    | "mage"   => level >= 10 ? "Archmage"  : "Apprentice"
    | "knight" => level >= 5  ? "Champion"  : "Squire"
    | _        => "Adventurer"
  }
}

@test "mage lv10 is Archmage"  { level_title("mage", 10)  === "Archmage" }
@test "knight lv3 is Squire"   { level_title("knight", 3) === "Squire"   }
```

```
node dist/cli.js --test examples/rpg.axn
  ✓ level_title: mage lv10 = Archmage
  ✓ hp_status_label: 0 = DEAD
  15 passed, 0 failed, 15 total
```

---

## Why Axon?

OOP and mutable state exist to help *humans* manage large codebases. AI code generators don't have those constraints — they benefit from the opposite: unambiguous data flow, explicit effects, and constraints that are machine-checkable at the type level.

| Feature | What it does |
|---|---|
| `@intent` | Machine-readable natural language description, embedded in JS output as JSDoc |
| `@pure` / `@total` | Compiler-checked contracts — no side effects, no partial functions |
| `where` constraints | Types carry predicates; guard clauses are injected automatically |
| `@memo` | Compile-time memoization for pure total functions |
| Tagged unions | Sum types with exhaustive pattern matching |
| `@test` | Inline test declarations, runnable with `--test` |
| `\|>` pipelines | Left-to-right functional composition with optional `as` naming |
| `import` / `export` | Multi-file modules — bundled to a single JS file with `axon --bundle` |

---

## Installation

```bash
npm install -g axon-lang
```

Or run from source:

```bash
git clone https://github.com/axon-pl/axon
cd axon
npm install
npx tsc
```

---

## Usage

```bash
# Transpile a single file
axon input.axn output.js

# Bundle a multi-file project (v0.5)
axon --bundle main.axn output.js

# Run @test declarations
axon --test input.axn
```

---

## Language Tour

### Functions

```axon
// Full form
fn add :: (a: int, b: int) -> int {
  @pure @total
  a + b
}

// Short form
fn double(n: int) = n * 2

// Lambda
let square = x => x * x
```

### Constrained types

```axon
type EmailAddress = string where value.includes("@") && value.length > 3
type Percentage   = int    where value >= 0 && value <= 100

// Guard clause injected automatically at function entry
fn send_welcome :: (email: EmailAddress) -> void {
  @effects ["email"]
  @intent "Send a welcome email — address validated by type constraint"
  console.log("Sending to {email}")
}
```

### Pattern matching with guards

```axon
fn classify :: (score: int) -> string =
  match score {
    | n when n >= 90 => "A"
    | n when n >= 80 => "B"
    | n when n >= 70 => "C"
    | _              => "F"
  }
```

### Tagged unions

```axon
type Shape =
  | Circle   { r: float }
  | Rect     { w: float, h: float }
  | Point

fn area :: (s: Shape) -> float =
  @exhaustive
  match s {
    | Circle { r }  => 3.14159 * r * r
    | Rect { w, h } => w * h
    | Point         => 0.0
  }
```

### Pipelines

```axon
let result =
  heroes
    |> filter(.alive)
    |> map(.score)
    |> sum

// Named intermediates
let total =
  party
    |> filter(.alive) |> as alive
    |> map(.hp)
    |> sum
```

### Triple-quote strings

```axon
let intro = """
In the realm of ALDENMOOR, a great evil has awakened.

Crops wilt.  Rivers run backwards.
Something must be done."""
```

### Modules (v0.5)

```axon
// tiles.axn
export type Tile = | Floor | Wall | Door | Stairs | Chest | Water | Torch

export fn tile_glyph(tag: string) -> string =
  match tag {
    | "Floor"  => "·"  | "Wall"  => "█"
    | "Stairs" => "≋"  | _       => "?"
  }

// main.axn
import { tile_glyph } from "./tiles"
import { generate }   from "./generator"
import { render_map } from "./renderer"

fn mount() {
  let map = generate(22, 48, 1, 7777)
  document.getElementById("out").innerHTML = render_map(map)
}
mount()
```

```bash
axon --bundle main.axn bundle.js
# ✓ Bundled tiles.axn + generator.axn + renderer.axn + main.axn
#   4 modules → 407 lines JS
```

### Built-in testing

```axon
@test "circle area r=1"  { area(Circle(1.0)) > 3.14 }
@test "rect 4x3 = 12"    { area(Rect(4.0, 3.0)) === 12.0 }
```

```bash
axon --test shapes.axn
  ✓ circle area r=1
  ✓ rect 4x3 = 12
  2 passed, 0 failed, 2 total
```

---

## Demos

| Demo | Description |
|---|---|
| [The Bazaar](https://axon-pl.github.io/axon/bazaar.html) | **v0.7** — RPG item shop; generics, `interface`, `let infer`, immutable state |
| [Dungeon Map Toolkit](https://axon-pl.github.io/axon/dungeon.html) | **v0.5–v0.6** — 4-file module demo with `Result` config parser |
| [RPG Adventure](https://axon-pl.github.io/axon/rpg.standalone.html) | 50-battle dungeon crawl — 1576 lines of pure Axon game logic |
| [Combat Engine](https://axon-pl.github.io/axon/combat.html) | Turn-based combat system |
| [Music Library](https://axon-pl.github.io/axon/music.html) | Synthwave track browser |

---

## Documentation

Full language reference at **[axon-pl.github.io/axon/docs.html](https://axon-pl.github.io/axon/docs.html)**

- [Functions](https://axon-pl.github.io/axon/docs.html#functions)
- [Types & Constraints](https://axon-pl.github.io/axon/docs.html#types)
- [Tagged Unions](https://axon-pl.github.io/axon/docs.html#tagged-unions)
- [Pattern Matching](https://axon-pl.github.io/axon/docs.html#pattern-matching)
- [Annotations](https://axon-pl.github.io/axon/docs.html#ann-pure)
- [Modules](https://axon-pl.github.io/axon/docs.html#modules)
- [Version History](https://axon-pl.github.io/axon/docs.html#version-history)
- [Roadmap](https://axon-pl.github.io/axon/docs.html#roadmap)

---

## Roadmap

| Version | Theme | Key features |
|---|---|---|
| v0.4 ✓ | Guards & Unions | `when` guards, tagged unions, `@test`, `?.` / `??`, destructuring, heredocs |
| v0.5 ✓ | Modules | `import` / `export`, `axon --bundle` — multi-file projects |
| v0.5.2 ✓ | Ergonomics | `for` loops (range + forEach), `break`/`continue`, `let mut` |
| v0.6 ✓ | Safety | `Result<T>`, `?` propagation, error contracts, `refine x: "claim"` semantic narrowing |
| **v0.7** ✓ | Type System | Generics `<T,U>`, `interface`, `fn(T)->U` type expr, `let infer` model-resolved types |
| v0.8 | Async & Reactive | `async fn`, `await`, `store` reactive state, enforced `@effects`, `@intent` auto-validation |
| v0.9 | Tooling | LSP, source maps, `axon fmt`, rich errors, `explain { }` semantic context blocks |
| v1.0 | Stability | Frozen spec, semver promise, `axon spec` extracts `@intent`/`refine`/`explain` as JSON |
| v1.1 | AI-Native | `likely` arms — probabilistic pattern matching by semantic similarity |

---

## VS Code Extension

Syntax highlighting for `.axn` files is available in `vscode-extension/`. Install via **Extensions: Install from VSIX** in the command palette.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and PRs welcome.

---

## License

[MIT](LICENSE) — © 2026 axon-pl

---

## Support

If Axon is useful to you, consider [sponsoring the project on GitHub](https://github.com/sponsors/axon-pl). It helps keep development going.
