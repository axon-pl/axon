# Contributing to Synth

Thanks for your interest in contributing. Synth is a small, focused project and every contribution counts.

---

## Ways to contribute

- **Bug reports** — open an issue with a minimal `.syn` repro
- **Feature requests** — open an issue describing the use case (not just the feature)
- **Bug fixes** — open a PR with a failing `@test` that your fix makes pass
- **New examples** — `.syn` files in `examples/` that demonstrate real use cases
- **Docs improvements** — typos, clarity, missing explanations in `demo/docs.html`

---

## Getting started

```bash
git clone https://github.com/synth-lang/synth
cd synth
npm install
npx tsc          # compile the compiler
npm test         # run @test suites
```

The compiler pipeline lives in `src/`:

| File | Role |
|---|---|
| `src/lexer.ts` | Tokenizer — source text → token stream |
| `src/parser.ts` | Recursive-descent parser — tokens → AST |
| `src/types.ts` | AST node type definitions |
| `src/codegen.ts` | Code generator — AST → JavaScript |
| `src/checker.ts` | Static checker — `@pure`, exhaustiveness, etc. |
| `src/stdlib.ts` | Runtime library prepended to every output file |
| `src/cli.ts` | CLI entry point |

---

## Workflow

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes in `src/`
3. Run `npx tsc` to rebuild
4. Add a `@test` in `examples/v04_features.syn` (or a new `.syn` file) covering your change
5. Run `npm test` — all tests must pass
6. Open a PR with a clear description of what changed and why

---

## Code style

- TypeScript throughout — no `any` unless genuinely unavoidable
- Compiler errors are `throw new ParseError(...)` — never `console.error` + return
- Generated JS should be readable — prefer named variables over one-liners in codegen
- New language features need coverage in: lexer, parser, codegen, checker, and at least one `@test`

---

## Adding a language feature

Every new syntax feature touches at least five files:

1. **`src/types.ts`** — add AST node interface(s) and any new `TokenType` values
2. **`src/lexer.ts`** — recognise new keywords or operator characters
3. **`src/parser.ts`** — parse the new construct into the AST
4. **`src/codegen.ts`** — emit JavaScript for the new node
5. **`src/checker.ts`** — walk the new node in `walkExpr` / `walkBlock` / `walkStmt`

Then add tests in `examples/` and verify with `npm test`.

---

## Reporting bugs

Please include:

- Synth source that triggers the bug (minimal reproduction)
- Expected output
- Actual output or error message
- Synth version (`node dist/cli.js --version` once that flag exists, or the git SHA)

---

## License

By contributing you agree that your contributions will be licensed under the [MIT License](LICENSE).
