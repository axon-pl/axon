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
# Transpile
axon input.axn output.js

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
| [RPG Adventure](https://axon-lang.dev/demo/rpg.standalone.html) | 50-battle dungeon crawl — 1576 lines of pure Axon game logic |
| [Combat Engine](https://axon-lang.dev/demo/combat.html) | Turn-based combat system |
| [Music Library](https://axon-lang.dev/demo/music.html) | Synthwave track browser |
| [Web Controls](https://axon-lang.dev/demo/index.html) | Interactive UI components |

---

## Documentation

Full language reference at **[axon-lang.dev/docs](https://axon-lang.dev/docs)**

- [Functions](https://axon-lang.dev/docs#functions)
- [Types & Constraints](https://axon-lang.dev/docs#types)
- [Tagged Unions](https://axon-lang.dev/docs#tagged-unions)
- [Pattern Matching](https://axon-lang.dev/docs#pattern-matching)
- [Annotations](https://axon-lang.dev/docs#ann-pure)
- [Version History](https://axon-lang.dev/docs#version-history)
- [Roadmap](https://axon-lang.dev/docs#roadmap)

---

## Roadmap

| Version | Theme | Key feature |
|---|---|---|
| **v0.4** ✓ | Guards & Unions | `when` guards, tagged unions, `@test`, `?.` / `??`, destructuring, heredocs |
| v0.5 | Modules | `import` / `export` — multi-file projects |
| v0.6 | Safety | `Result<T>`, `?` propagation, error contracts |
| v0.7 | Type System | Generics, `interface`, typed stdlib |
| v0.8 | Async | `async fn`, `await`, enforced `@effects` |
| v0.9 | Tooling | LSP, source maps, `axon fmt`, rich errors |
| v1.0 | Stability | Frozen spec, semver promise, `axon spec` AI extraction |

---

## VS Code Extension

Syntax highlighting for `.axn` files is available in `vscode-extension/`. Install via **Extensions: Install from VSIX** in the command palette.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and PRs welcome.

---

## License

[MIT](LICENSE) — © 2026 axon-pl
