# Synth Language

Syntax highlighting and language support for [Synth](https://github.com/synth-pl/synth) — an AI-native programming language that transpiles to JavaScript.

## Install

From this directory:

```powershell
.\install.ps1
```

This installs v1.0.1 into **both** Cursor and VS Code extension folders, removes legacy installs, then prompts you to reload the editor window.

> Grammar-only extensions must not declare `activationEvents` without a `main` entry — Cursor rejects them otherwise.

## Features

- Syntax highlighting for `.syn` files (v1.0: template literals, triple-quoted strings, `store`/`on`, `async`/`await`, `and`/`or`/`not`, `??`/`?.`, hex/binary numbers)
- Bracket matching and auto-closing
- Comment toggling (`//` line comments)
- Language icons

## About Synth

Synth is a concise, expressive language designed for AI-assisted development. Features include:

- `store` — reactive state
- `match` — pattern matching
- `@memo` — memoization
- `do` notation — block expressions
- Pipeline operator (`|>`)
- Spread, object shorthand, async/await

```synth
store Player {
  hp:    int    = 100
  level: int    = 1
}

fn status(hp) =
  match hp {
    | 0       => "defeated"
    | 1..25   => "critical"
    | 26..50  => "hurt"
    | _       => "healthy"
  }
```

## Links

- [GitHub](https://github.com/synth-pl/synth)
- [Live Playground](https://synth-pl.github.io/synth/playground.html)
- [Language Demos](https://synth-pl.github.io/synth/landing.html)
