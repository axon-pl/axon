// ─────────────────────────────────────────────────────────────────────────────
// Axon v0.9.5 — Recursive-descent parser
// ─────────────────────────────────────────────────────────────────────────────

import {
  Token, TokenType,
  Program, TopLevelDecl,
  TypeAlias, TaggedUnionDecl, UnionVariant, TestDecl,
  RecordDecl, FieldDecl, FnDecl, ModuleDecl,
  ImportDecl, ExportDecl, TopLevelExpr, TopLevelLet, TopLevelStmt,
  InterfaceDecl, InterfaceField,
  StoreDecl, StoreField, EnumDecl,
  Annotation, FnParam, TypeExpr,
  Expr, BlockExpr, BlockStmt, MatchArm, MatchPattern,
  ObjectProperty, LambdaParam,
  AwaitExpr,
  Constraint, PipeAsStep,
} from './types.js'

export class ParseError extends Error {
  constructor(msg: string, public line: number, public col: number) {
    super(`[line ${line}:${col}] ${msg}`)
    this.name = 'ParseError'
  }
}

export class Parser {
  private pos = 0
  // v0.4: set true while parsing a `when` guard so bare `ident =>` is not
  // mistaken for a lambda (=> is the match arm separator immediately after the guard)
  private inMatchGuard = false
  // v0.9.5: collected errors for multi-error reporting
  private errors: ParseError[] = []

  constructor(private tokens: Token[]) {}

  // ── Entry point ─────────────────────────────────────────────────────────────

  // v0.9.5: returns { ast, errors } — collects all errors with panic-mode recovery
  parse(): { ast: Program; errors: ParseError[] } {
    const body: TopLevelDecl[] = []
    while (!this.isEOF()) {
      try {
        const decl = this.parseTopLevel()
        if (decl) body.push(decl)
      } catch (e) {
        if (e instanceof ParseError) {
          this.errors.push(e)
          this.syncToNextTopLevel()
        } else {
          throw e
        }
      }
    }
    return { ast: { kind: 'Program', body }, errors: this.errors }
  }

  // Advance past tokens until a safe top-level keyword is found
  private syncToNextTopLevel(): void {
    const syncPoints = new Set<string>([
      'KW_FN', 'KW_TYPE', 'KW_RECORD', 'KW_MODULE', 'KW_IMPORT', 'KW_EXPORT',
      'KW_LET', 'KW_INTERFACE', 'KW_ASYNC', 'KW_ENUM', 'EOF',
    ])
    while (!this.isEOF()) {
      const tok = this.peek()
      if (syncPoints.has(tok.type)) break
      // "store Name {" and "on Name." are contextual top-level keywords
      if (tok.type === 'IDENT' && (tok.value === 'store' || tok.value === 'on')) break
      this.advance()
    }
  }

  // ── Top-level declarations ───────────────────────────────────────────────────

  private parseTopLevel(): TopLevelDecl | null {
    const tok = this.peek()
    if (tok.type === 'KW_ENUM')      return this.parseEnumDecl()
    if (tok.type === 'KW_TYPE')      return this.parseTypeAliasOrUnion()
    if (tok.type === 'KW_RECORD')    return this.parseRecord()
    if (tok.type === 'KW_FN')        return this.parseFnDecl()
    if (tok.type === 'KW_MODULE')    return this.parseModule()
    if (tok.type === 'KW_INTERFACE') return this.parseInterfaceDecl()  // v0.7
    // v0.8: async fn declaration — async fn name(params) { body }
    if (tok.type === 'KW_ASYNC') {
      const { line } = this.advance() // consume async
      const decl = this.parseFnDecl()
      decl.isAsync = true
      return decl
    }
    // v0.8: store Name { field: Type = default }
    // Contextual — "store" kept as IDENT to avoid breaking identifiers named store.
    if (tok.type === 'IDENT' && tok.value === 'store' &&
        this.tokens[this.pos + 1]?.type === 'IDENT' &&
        this.tokens[this.pos + 2]?.type === 'LBRACE') {
      return this.parseStoreDecl()
    }
    // v0.8: on StoreName.change { body } — reactive subscription sugar
    if (tok.type === 'IDENT' && tok.value === 'on' &&
        this.tokens[this.pos + 1]?.type === 'IDENT' &&
        this.tokens[this.pos + 2]?.type === 'DOT') {
      const { line } = this.advance() // consume 'on'
      const expr = this.parseOnChangeExpr()
      return { kind: 'TopLevelExpr', expr, line } as TopLevelExpr
    }
    // v0.4: top-level @test "description" { expr }
    if (tok.type === 'AT' && tok.value === '@test') return this.parseTestDecl()
    // v0.5: import { ... } from "..."
    if (tok.type === 'KW_IMPORT') return this.parseImportDecl()
    // v0.5: export fn / export type / export record
    if (tok.type === 'KW_EXPORT') return this.parseExportDecl()
    // v0.5: top-level let binding (e.g. let state = {...})
    if (tok.type === 'KW_LET') return this.parseTopLevelLet()
    // v0.5.2: top-level for loop
    if (tok.type === 'KW_FOR') {
      const { line } = this.peek()
      const stmt = this.parseForStmt()
      return { kind: 'TopLevelStmt', stmt, line }
    }
    // v0.9.8: top-level while loop
    if (tok.type === 'KW_WHILE') {
      const { line } = this.peek()
      const stmt = this.parseWhileStmt()
      return { kind: 'TopLevelStmt', stmt, line }
    }
    // v0.6: pre-fn annotations — @throws fn foo(...) / @pure fn bar(...)
    // Collect the annotations, then expect fn/record/type/async fn to follow.
    if (tok.type === 'AT' && tok.value !== '@test') {
      const preAnns = this.parseAnnotations()
      const next = this.peek()
      if (next.type === 'KW_FN') {
        const decl = this.parseFnDecl()
        decl.annotations = [...preAnns, ...decl.annotations]
        return decl
      }
      // v0.8: @effects ["timer"] async fn ...
      if (next.type === 'KW_ASYNC') {
        this.advance() // consume async
        const decl = this.parseFnDecl()
        decl.isAsync = true
        decl.annotations = [...preAnns, ...decl.annotations]
        return decl
      }
      if (next.type === 'KW_EXPORT') {
        const exported = this.parseExportDecl()
        if (exported.decl.kind === 'FnDecl') {
          exported.decl.annotations = [...preAnns, ...exported.decl.annotations]
        }
        return exported
      }
      // fallthrough — treat as top-level expr (annotations emitted as AT tokens)
    }
    // v0.5: bare expression statement at top level (e.g. mount())
    if (tok.type !== 'EOF') {
      const line = tok.line
      const expr = this.parseExpr()
      return { kind: 'TopLevelExpr', expr, line } as TopLevelExpr
    }
    this.advance()
    return null
  }

  // v0.8: store Name { field: Type = default; ... }
  private parseStoreDecl(): StoreDecl {
    const { line } = this.advance() // consume 'store' (IDENT)
    const name = this.expect('IDENT').value
    this.expect('LBRACE')
    const fields: StoreField[] = []
    while (!this.check('RBRACE') && !this.isEOF()) {
      const fieldName = this.expect('IDENT').value
      this.expect('COLON')
      const type = this.parseTypeExpr()
      this.expect('ASSIGN')
      const defaultVal = this.parseExpr()
      fields.push({ name: fieldName, type, default: defaultVal })
      this.tryConsume('SEMICOLON')
      this.tryConsume('COMMA')
    }
    this.expect('RBRACE')
    return { kind: 'StoreDecl', name, fields, line }
  }

  // v0.8: on StoreName.change { body } — desugars at parse time to:
  //       StoreName.subscribe(() => { body })
  private parseOnChangeExpr(): Expr {
    const storeName = this.expect('IDENT').value
    this.expect('DOT')
    this.expect('IDENT') // consume 'change'
    this.expect('LBRACE')
    const rawBody = this.parseBlockBody(true)
    this.expect('RBRACE')
    const body: BlockExpr = rawBody.kind === 'BlockExpr'
      ? rawBody
      : { kind: 'BlockExpr', stmts: [{ kind: 'ExprStmt', value: rawBody }] }
    // Desugar: StoreName.subscribe(() => { body })
    return {
      kind: 'CallExpr',
      callee: {
        kind: 'MemberExpr',
        object: { kind: 'Identifier', name: storeName },
        property: 'subscribe',
      },
      args: [{
        kind: 'LambdaExpr',
        params: [],
        body,
      }],
    }
  }

  private parseTopLevelLet(): TopLevelLet {
    const { line } = this.advance() // consume 'let'
    this.tryConsume('KW_MUT')       // v0.5.2: let mut — JS uses let for both
    let name: string | null
    if (this.check('UNDERSCORE') || (this.check('IDENT') && this.peek().value === '_')) {
      this.advance(); name = null
    } else {
      name = this.expect('IDENT').value
    }
    this.expect('ASSIGN')
    const value = this.parseExpr()
    this.tryConsume('SEMICOLON')
    return { kind: 'TopLevelLet', name, value, line } as TopLevelLet
  }

  // v0.4: @test "description" { assertion_expr }
  private parseTestDecl(): TestDecl {
    const { line } = this.advance() // consume @test
    const description = this.expect('STRING').value
    this.expect('LBRACE')
    const body = this.parseBlockBody()
    this.expect('RBRACE')
    return { kind: 'TestDecl', description, body, line }
  }

  // v0.5: import { name, name } from "./path"
  private parseImportDecl(): ImportDecl {
    const { line } = this.advance() // consume import
    const names: string[] = []
    this.expect('LBRACE')
    while (!this.check('RBRACE') && !this.isEOF()) {
      names.push(this.expect('IDENT').value)
      if (this.check('COMMA')) this.advance()
    }
    this.expect('RBRACE')
    this.expect('KW_FROM')
    const source = this.expect('STRING').value
    return { kind: 'ImportDecl', names, source, line }
  }

  // v0.5: export fn / export type / export record
  private parseExportDecl(): ExportDecl {
    const { line } = this.advance() // consume export
    const tok = this.peek()
    let decl: ExportDecl['decl']
    if (tok.type === 'KW_FN')     decl = this.parseFnDecl()
    else if (tok.type === 'KW_TYPE')   decl = this.parseTypeAliasOrUnion() as TypeAlias | TaggedUnionDecl
    else if (tok.type === 'KW_RECORD') decl = this.parseRecord()
    else throw new ParseError(`Expected fn, type, or record after export`, tok.line, tok.col)
    return { kind: 'ExportDecl', decl, line }
  }

  // v0.4: detect tagged union syntax — type T = | Variant { fields } | ...
  // v0.9.5: enum Color = Red | Green | Blue
  private parseEnumDecl(): EnumDecl {
    const { line } = this.expect('KW_ENUM')
    const name = this.expect('IDENT').value
    this.expect('ASSIGN')
    const variants: string[] = []
    // Leading pipe is optional: enum Foo = A | B  or  enum Foo = | A | B
    if (this.check('PIPE')) this.advance()
    variants.push(this.expect('IDENT').value)
    while (this.check('PIPE')) {
      this.advance()
      variants.push(this.expect('IDENT').value)
    }
    return { kind: 'EnumDecl', name, variants, line }
  }

  private parseTypeAliasOrUnion(): TypeAlias | TaggedUnionDecl {
    const { line } = this.expect('KW_TYPE')
    const name = this.expect('IDENT').value
    const typeParams = this.parseTypeParams()   // v0.7: optional <T, U>
    this.expect('ASSIGN')

    // Tagged union: type T = | V1 | V2 { field: type } ...
    if (this.check('PIPE')) {
      return this.parseTaggedUnionBody(name, line)
    }

    const type = this.parseTypeExpr()
    let constraint: Constraint | undefined
    if (this.check('KW_WHERE')) {
      this.advance()
      constraint = this.parseConstraint()
    }
    return { kind: 'TypeAlias', name, typeParams, type, constraint, line }
  }

  private parseTaggedUnionBody(name: string, line: number): TaggedUnionDecl {
    const variants: UnionVariant[] = []
    while (this.check('PIPE')) {
      this.advance() // consume |
      const varName = this.expect('IDENT').value
      const fields: FieldDecl[] = []
      if (this.check('LBRACE')) {
        this.advance()
        while (!this.check('RBRACE') && !this.isEOF()) {
          const fieldName = this.expect('IDENT').value
          this.expect('COLON')
          const fieldType = this.parseTypeExpr()
          fields.push({ name: fieldName, type: fieldType })
          this.tryConsume('COMMA')
        }
        this.expect('RBRACE')
      }
      variants.push({ name: varName, fields })
    }
    return { kind: 'TaggedUnionDecl', name, variants, line }
  }

  private parseConstraint(): Constraint {
    return this.parseOrConstraint()
  }

  private parseOrConstraint(): Constraint {
    let left = this.parseAndConstraint()
    while (this.check('OR')) {
      this.advance()
      left = { kind: 'OrConstraint', left, right: this.parseAndConstraint() }
    }
    return left
  }

  private parseAndConstraint(): Constraint {
    let left = this.parseUnaryConstraint()
    while (this.check('AND')) {
      this.advance()
      left = { kind: 'AndConstraint', left, right: this.parseUnaryConstraint() }
    }
    return left
  }

  private parseUnaryConstraint(): Constraint {
    if (this.check('BANG')) {
      this.advance()
      return { kind: 'NotConstraint', inner: this.parseUnaryConstraint() }
    }
    return this.parsePrimaryConstraint()
  }

  private parsePrimaryConstraint(): Constraint {
    const tok = this.peek()

    if (tok.type === 'IDENT' && tok.value === 'matches') {
      this.advance()
      this.expect('LPAREN')
      const arg = this.peek()
      if (arg.type === 'REGEX') {
        const m = this.advance().value.match(/^\/(.*)\/([gimsuy]*)$/)
        this.expect('RPAREN')
        return { kind: 'RegexConstraint', pattern: m?.[1] ?? '', flags: m?.[2] ?? '' }
      }
      if (arg.type === 'AT' || (arg.type === 'IDENT' && arg.value.startsWith('#'))) {
        const preset = this.advance().value.replace(/^[@#]/, '')
        this.expect('RPAREN')
        return { kind: 'MatchesConstraint', preset }
      }
      this.expect('RPAREN')
      return { kind: 'MatchesConstraint', preset: 'custom' }
    }

    if (tok.type === 'IDENT' && tok.value === 'length') {
      this.advance()
      const op = this.peek()
      if (op.type === 'GT' || op.type === 'GTE' || op.type === 'LT' || op.type === 'LTE' || op.type === 'EQ' || op.type === 'STRICT_EQ') {
        const opStr = this.advance().value
        const val = parseFloat(this.expect('NUMBER').value)
        return { kind: 'LengthConstraint', op: opStr, value: val }
      }
      return { kind: 'LengthConstraint', op: '>', value: 0 }
    }

    if (tok.type === 'GT' || tok.type === 'GTE' || tok.type === 'LT' || tok.type === 'LTE' || tok.type === 'EQ' || tok.type === 'STRICT_EQ' || tok.type === 'NEQ') {
      const op = this.advance().value
      const numTok = this.peek()
      if (numTok.type === 'MINUS') {
        this.advance()
        const neg = this.peek()
        if (neg.type === 'NUMBER') {
          return { kind: 'CompareConstraint', op, value: -parseFloat(this.advance().value) }
        }
      }
      if (numTok.type === 'NUMBER') return { kind: 'CompareConstraint', op, value: parseFloat(this.advance().value) }
      if (numTok.type === 'STRING') return { kind: 'CompareConstraint', op, value: this.advance().value }
      if (numTok.type === 'IDENT')  return { kind: 'CompareConstraint', op, value: this.advance().value }
    }

    if (tok.type === 'LPAREN') {
      this.advance()
      const inner = this.parseConstraint()
      this.expect('RPAREN')
      return inner
    }

    const expr = this.parseExpr()
    return { kind: 'CustomConstraint', expr }
  }

  private parseRecord(): RecordDecl {
    const { line } = this.expect('KW_RECORD')
    const name = this.expect('IDENT').value
    const typeParams = this.parseTypeParams()   // v0.7: optional <T, U>
    this.expect('LBRACE')
    const fields: FieldDecl[] = []
    while (!this.check('RBRACE') && !this.isEOF()) {
      const fieldName = this.expect('IDENT').value
      this.expect('COLON')
      const type = this.parseTypeExpr()
      fields.push({ name: fieldName, type })
      this.tryConsume('COMMA')
    }
    this.expect('RBRACE')
    return { kind: 'RecordDecl', name, typeParams, fields, line }
  }

  // v0.7: interface Name<T> { field: Type; method: fn(T) -> U }
  private parseInterfaceDecl(): InterfaceDecl {
    const { line } = this.expect('KW_INTERFACE')
    const name = this.expect('IDENT').value
    const typeParams = this.parseTypeParams()
    this.expect('LBRACE')
    const fields: InterfaceField[] = []
    while (!this.check('RBRACE') && !this.isEOF()) {
      const fieldName = this.expect('IDENT').value
      this.expect('COLON')
      const type = this.parseTypeExpr()
      fields.push({ name: fieldName, type })
      this.tryConsume('SEMICOLON')
      this.tryConsume('COMMA')
    }
    this.expect('RBRACE')
    return { kind: 'InterfaceDecl', name, typeParams, fields, line }
  }

  // v0.7: parse optional <T, U, V> type parameter list after a name
  private parseTypeParams(): string[] {
    if (!this.check('LT')) return []
    this.advance()  // consume <
    const params: string[] = []
    while (!this.check('GT') && !this.isEOF()) {
      params.push(this.expect('IDENT').value)
      this.tryConsume('COMMA')
    }
    this.expect('GT')
    return params
  }

  private parseFnDecl(): FnDecl {
    const { line } = this.expect('KW_FN')
    const name = this.expect('IDENT').value
    const typeParams = this.parseTypeParams()   // v0.7: optional <T, U>

    // Short-form: fn name(params) = expr
    if (this.check('LPAREN') && !this.isDoubleColonAhead()) {
      this.advance() // (
      const params: FnParam[] = []
      while (!this.check('RPAREN') && !this.isEOF()) {
        const paramName = this.expect('IDENT').value
        let paramType: TypeExpr = { name: 'any' }
        if (this.check('COLON')) {
          this.advance()
          paramType = this.parseTypeExpr()
        }
        params.push({ name: paramName, type: paramType })
        this.tryConsume('COMMA')
      }
      this.expect('RPAREN')
      // Short-form may optionally carry a return type: fn f(x) -> T = expr | { block }
      let returnType: TypeExpr = { name: 'any' }
      if (this.check('THIN_ARROW')) {
        this.advance()
        returnType = this.parseTypeExpr()
      }
      // Body: either `= expr` (expression form) or `{ block }` (block form)
      let body: Expr
      let isShort = true
      if (this.check('ASSIGN')) {
        this.advance()
        body = this.parseExpr()
      } else {
        this.expect('LBRACE')
        const annotations = this.parseAnnotations()
        body = this.parseBlockBody()
        this.expect('RBRACE')
        isShort = false
      }
      return { kind: 'FnDecl', name, typeParams, params, returnType, annotations: [], body, shortForm: isShort, line }
    }

    // Full form: fn name :: (params) -> ReturnType { body }
    this.expect('DOUBLE_COLON')
    this.expect('LPAREN')
    const params: FnParam[] = []
    while (!this.check('RPAREN') && !this.isEOF()) {
      const spread = !!this.tryConsume('SPREAD')
      const paramName = this.expect('IDENT').value
      this.expect('COLON')
      const paramType = this.parseTypeExpr()
      params.push({ name: paramName, type: paramType, spread })
      this.tryConsume('COMMA')
    }
    this.expect('RPAREN')
    this.expect('THIN_ARROW')
    const returnType = this.parseTypeExpr()

    this.expect('LBRACE')
    const annotations = this.parseAnnotations()
    const body = this.parseBlockBody()
    this.expect('RBRACE')

    return { kind: 'FnDecl', name, typeParams, params, returnType, annotations, body, line }
  }

  private isDoubleColonAhead(): boolean {
    return this.tokens[this.pos]?.type === 'DOUBLE_COLON'
  }

  private parseModule(): ModuleDecl {
    const { line } = this.expect('KW_MODULE')
    const name = this.expect('IDENT').value
    this.expect('LBRACE')
    const annotations = this.parseAnnotations()
    const body: TopLevelDecl[] = []
    while (!this.check('RBRACE') && !this.isEOF()) {
      const decl = this.parseTopLevel()
      if (decl) body.push(decl)
    }
    this.expect('RBRACE')
    return { kind: 'ModuleDecl', name, annotations, body, line }
  }

  // ── Annotations ──────────────────────────────────────────────────────────────

  private parseAnnotations(): Annotation[] {
    const anns: Annotation[] = []
    while (this.check('AT')) {
      const tok = this.advance()
      const annName = tok.value.slice(1)
      // Skip inline @test annotations inside function bodies — they're not supported here
      if (annName === 'test') continue
      let value: string | string[] | null = null
      if (this.check('STRING')) {
        value = this.advance().value
      } else if (this.check('LBRACKET')) {
        this.advance()
        const parts: string[] = []
        while (!this.check('RBRACKET') && !this.isEOF()) {
          parts.push(this.advance().value)
          this.tryConsume('COMMA')
        }
        this.expect('RBRACKET')
        value = parts
      }
      anns.push({ name: annName, value })
    }
    return anns
  }

  // ── Type expressions ─────────────────────────────────────────────────────────

  private parseTypeExpr(): TypeExpr {
    if (this.check('LBRACE')) {
      this.advance()
      const fields: FieldDecl[] = []
      while (!this.check('RBRACE') && !this.isEOF()) {
        const fieldName = this.expect('IDENT').value
        this.expect('COLON')
        const ft = this.parseTypeExpr()
        fields.push({ name: fieldName, type: ft })
        this.tryConsume('COMMA')
      }
      this.expect('RBRACE')
      return { name: '__object__', typeArgs: fields.map(f => ({ name: f.name, typeArgs: [f.type] })) }
    }

    // v0.7: fn(T, U) -> V function type expression
    if (this.check('KW_FN')) {
      this.advance()  // consume fn
      this.expect('LPAREN')
      const fnParams: TypeExpr[] = []
      while (!this.check('RPAREN') && !this.isEOF()) {
        fnParams.push(this.parseTypeExpr())
        this.tryConsume('COMMA')
      }
      this.expect('RPAREN')
      let fnReturn: TypeExpr = { name: 'any' }
      if (this.check('THIN_ARROW')) {
        this.advance()
        fnReturn = this.parseTypeExpr()
      }
      return { name: 'fn', fnParams, fnReturn }
    }

    if (this.check('IDENT') && this.peek().value === 'void') {
      this.advance()
      return { name: 'void' }
    }

    let name = this.expect('IDENT').value

    const typeArgs: TypeExpr[] = []
    if (this.check('LT')) {
      this.advance()
      typeArgs.push(this.parseTypeExpr())
      while (this.tryConsume('COMMA')) {
        typeArgs.push(this.parseTypeExpr())
      }
      this.expect('GT')
    }

    let isArray = false
    if (this.check('LBRACKET') && this.tokens[this.pos + 1]?.type === 'RBRACKET') {
      this.advance(); this.advance()
      isArray = true
    }

    let isOptional = false
    if (this.check('QUESTION')) {
      this.advance(); isOptional = true
    }

    return { name, typeArgs: typeArgs.length ? typeArgs : undefined, isArray, isOptional }
  }

  // ── Function body block ──────────────────────────────────────────────────────

  // stmtMode: true for for-loop bodies — last expression becomes ExprStmt, not ReturnStmt
  private parseBlockBody(stmtMode = false): Expr {
    const stmts: BlockStmt[] = []

    while (!this.check('RBRACE') && !this.isEOF()) {
      // Return statement — bare `return` emits `return undefined`
      if (this.check('KW_RETURN')) {
        this.advance()
        if (this.check('RBRACE') || this.check('SEMICOLON') || this.isEOF()) {
          this.tryConsume('SEMICOLON')
          stmts.push({ kind: 'ReturnStmt', value: { kind: 'Identifier', name: 'undefined' } })
          continue
        }
        const value = this.tryPropagation(this.parseExpr())  // v0.6: return expr?
        this.tryConsume('SEMICOLON')
        stmts.push({ kind: 'ReturnStmt', value })
        continue
      }

      // If statement — always parsed in stmtMode=true (no return injection);
      // returns are injected after the loop by injectTailReturns for the last IfStmt.
      if (this.check('KW_IF')) {
        const ifStmt = this.parseIfStmt(true)
        stmts.push(ifStmt)
        continue
      }

      // Nested function declaration — treated as a let binding to a lambda/fn
      if (this.check('KW_FN')) {
        const fn = this.parseFnDecl()
        // Emit as a let binding: `let name = fn(params) => body`
        const lambdaExpr: Expr = {
          kind: 'LambdaExpr',
          params: fn.params.map(p => p.name as string),
          body: fn.body,
        }
        stmts.push({ kind: 'LetStmt', name: fn.name, value: lambdaExpr })
        continue
      }

      // v0.5.2: break / continue
      if (this.check('KW_BREAK')) {
        this.advance()
        this.tryConsume('SEMICOLON')
        stmts.push({ kind: 'BreakStmt' })
        continue
      }
      if (this.check('KW_CONTINUE')) {
        this.advance()
        this.tryConsume('SEMICOLON')
        stmts.push({ kind: 'ContinueStmt' })
        continue
      }

      // v0.8: on StoreName.change { body } — reactive subscription in block context
      if (this.check('IDENT') && this.peek().value === 'on' &&
          this.tokens[this.pos + 1]?.type === 'IDENT' &&
          this.tokens[this.pos + 2]?.type === 'DOT') {
        this.advance() // consume 'on'
        const onExpr = this.parseOnChangeExpr()
        this.tryConsume('SEMICOLON')
        stmts.push({ kind: 'ExprStmt', value: onExpr })
        continue
      }

      // v0.6: refine name: "semantic claim"
      if (this.check('KW_REFINE')) {
        this.advance()
        const name = this.expect('IDENT').value
        this.expect('COLON')
        const claim = this.expect('STRING').value
        this.tryConsume('SEMICOLON')
        stmts.push({ kind: 'RefineStmt', name, claim })
        continue
      }

      // v0.5.2: for loop — range or forEach
      //   for i in lo..hi  { body }   exclusive range
      //   for i in lo..=hi { body }   inclusive range
      //   for x in array   { body }   forEach (for..of)
      if (this.check('KW_FOR')) {
        stmts.push(this.parseForStmt())
        continue
      }

      // v0.9.8: while loop — while condition { body }
      if (this.check('KW_WHILE')) {
        stmts.push(this.parseWhileStmt())
        continue
      }

      // Let binding — including v0.4 destructuring forms and v0.5.2 let mut
      if (this.check('KW_LET')) {
        this.advance()

        // v0.5.2: let mut name = expr
        const mutable = this.check('KW_MUT')
        if (mutable) this.advance()

        // v0.7: let infer name = expr — model-resolved type annotation
        const infer = this.check('KW_INFER')
        if (infer) this.advance()

        // v0.4: object destructuring — let { a, b, c } = expr
        //       or with rename  — let { x: myX, y: myY } = expr
        if (this.check('LBRACE')) {
          this.advance()
          const names: string[] = []
          while (!this.check('RBRACE') && !this.isEOF()) {
            const key = this.expect('IDENT').value
            if (this.check('COLON')) {
              this.advance()
              const alias = this.expect('IDENT').value
              names.push(`${key}: ${alias}`)  // JS destructuring rename: { key: alias }
            } else {
              names.push(key)
            }
            this.tryConsume('COMMA')
          }
          this.expect('RBRACE')
          this.expect('ASSIGN')
          const value = this.parseExpr()
          stmts.push({ kind: 'DestructureStmt', style: 'object', names, value })
          this.tryConsume('SEMICOLON')
          continue
        }

        // v0.4: array destructuring — let [a, b, c] = expr
        if (this.check('LBRACKET')) {
          this.advance()
          const names: string[] = []
          while (!this.check('RBRACKET') && !this.isEOF()) {
            if (this.check('COMMA')) {
              names.push('_')   // skip slot: let [_, b] = arr
              this.advance()
              continue
            }
            names.push(this.expect('IDENT').value)
            this.tryConsume('COMMA')
          }
          this.expect('RBRACKET')
          this.expect('ASSIGN')
          const value = this.parseExpr()
          stmts.push({ kind: 'DestructureStmt', style: 'array', names, value })
          this.tryConsume('SEMICOLON')
          continue
        }

        // Normal let / let mut binding
        let name: string | null
        if (this.check('UNDERSCORE') || (this.check('IDENT') && this.peek().value === '_')) {
          this.advance(); name = null
        } else {
          name = this.expect('IDENT').value
        }
        this.expect('ASSIGN')
        const value = this.tryPropagation(this.parseExpr())  // v0.6: let x = expr?
        stmts.push({ kind: 'LetStmt', name, value, mutable, infer })
        this.tryConsume('SEMICOLON')
        continue
      }

      const expr = this.tryPropagation(this.parseExpr())  // v0.6: expr?
      this.tryConsume('SEMICOLON')

      if (!stmtMode && (this.check('RBRACE') || this.check('EOF'))) {
        stmts.push({ kind: 'ReturnStmt', value: expr })
      } else {
        stmts.push({ kind: 'ExprStmt', value: expr })
      }
    }

    // Tail-position fix: if the last stmt is an IfStmt in a function-body context
    // (!stmtMode), inject returns into its branches so it acts as the function's
    // implicit return value. This ensures if-stmts that are NOT the last stmt
    // in their block are never given premature returns.
    if (!stmtMode && stmts.length > 0) {
      const last = stmts[stmts.length - 1]
      if (last.kind === 'IfStmt') {
        this.injectTailReturns(last)
      }
    }

    if (!stmtMode && stmts.length === 1 && stmts[0].kind === 'ReturnStmt') {
      return stmts[0].value
    }

    return { kind: 'BlockExpr', stmts }
  }

  // Inject `return` into the tail-position branches of an IfStmt so it can
  // serve as a function's implicit return value.
  private injectTailReturns(stmt: BlockStmt): void {
    if (stmt.kind !== 'IfStmt') return
    this.injectTailIntoBlock(stmt.then)
    if (stmt.else_) this.injectTailIntoBlock(stmt.else_)
  }

  // Walk to the last statement in a block and convert ExprStmt → ReturnStmt,
  // or recurse into a nested IfStmt.
  private injectTailIntoBlock(block: BlockExpr): void {
    if (block.stmts.length === 0) return
    const last = block.stmts[block.stmts.length - 1]
    if (last.kind === 'ExprStmt') {
      ;(last as any).kind = 'ReturnStmt'
    } else if (last.kind === 'IfStmt') {
      this.injectTailReturns(last)
    }
  }

  // stmtMode propagates from the enclosing for-loop body so nested if blocks
  // also emit their last expression as ExprStmt instead of return.
  private parseIfStmt(stmtMode = false): BlockStmt {
    this.expect('KW_IF')
    // Parentheses around condition are optional: both `if (x)` and `if x` work
    const hasParens = this.check('LPAREN')
    if (hasParens) this.advance()
    const test = this.parseExpr()
    if (hasParens) this.expect('RPAREN')
    this.expect('LBRACE')
    const thenBody = this.parseBlockBody(stmtMode)
    this.expect('RBRACE')
    const fallback = stmtMode ? 'ExprStmt' : 'ReturnStmt'
    const thenBlock: BlockExpr = thenBody.kind === 'BlockExpr'
      ? thenBody
      : { kind: 'BlockExpr', stmts: [{ kind: fallback, value: thenBody }] }

    let elseBlock: BlockExpr | undefined
    if (this.check('KW_ELSE')) {
      this.advance()
      if (this.check('KW_IF')) {
        const nested = this.parseIfStmt(stmtMode)
        elseBlock = { kind: 'BlockExpr', stmts: [nested] }
      } else {
        this.expect('LBRACE')
        const elseBody = this.parseBlockBody(stmtMode)
        this.expect('RBRACE')
        elseBlock = elseBody.kind === 'BlockExpr'
          ? elseBody
          : { kind: 'BlockExpr', stmts: [{ kind: fallback, value: elseBody }] }
      }
    }
    return { kind: 'IfStmt', test, then: thenBlock, else_: elseBlock }
  }

  // v0.5.2: for i in lo..hi { } / for i in lo..=hi { } / for x in array { }
  private parseForStmt(): BlockStmt {
    this.expect('KW_FOR')
    const varName = this.expect('IDENT').value
    this.expect('KW_IN')
    const lo = this.parseExpr()   // parse lo, or the whole iterable if no range follows

    // Range form: lo..hi or lo..=hi
    if (this.check('DOTDOT') || this.check('DOTDOTEQ')) {
      const inclusive = this.check('DOTDOTEQ')
      this.advance()
      const hi = this.parseExpr()
      this.expect('LBRACE')
      const rawBody = this.parseBlockBody(true)   // stmtMode — no implicit return
      this.expect('RBRACE')
      const body: BlockExpr = rawBody.kind === 'BlockExpr'
        ? rawBody
        : { kind: 'BlockExpr', stmts: [{ kind: 'ExprStmt', value: rawBody }] }
      return { kind: 'ForRangeStmt', varName, lo, hi, inclusive, body }
    }

    // forEach form: for x in array { }  — lo is the iterable
    this.expect('LBRACE')
    const rawBody = this.parseBlockBody(true)     // stmtMode — no implicit return
    this.expect('RBRACE')
    const body: BlockExpr = rawBody.kind === 'BlockExpr'
      ? rawBody
      : { kind: 'BlockExpr', stmts: [{ kind: 'ExprStmt', value: rawBody }] }
    return { kind: 'ForInStmt', varName, iter: lo, body }
  }

  // v0.9.8: while condition { body }
  private parseWhileStmt(): BlockStmt {
    this.expect('KW_WHILE')
    const test = this.parseExpr()
    this.expect('LBRACE')
    const rawBody = this.parseBlockBody(true)   // stmtMode — no implicit return
    this.expect('RBRACE')
    const body: BlockExpr = rawBody.kind === 'BlockExpr'
      ? rawBody
      : { kind: 'BlockExpr', stmts: [{ kind: 'ExprStmt', value: rawBody }] }
    return { kind: 'WhileStmt', test, body }
  }

  // ── Expression parsing (precedence climbing) ─────────────────────────────────

  private parseExpr(): Expr {
    const left = this.parsePipeline()
    if (this.check('ASSIGN') && this.isAssignable(left)) {
      this.advance()
      const right = this.parseExpr()
      return { kind: 'BinaryExpr', op: '=', left, right }
    }
    // v0.9.6: compound assignment operators
    const compoundToks = ['PLUS_EQ', 'MINUS_EQ', 'STAR_EQ', 'SLASH_EQ', 'PERCENT_EQ', 'NULL_COALESCE_EQ'] as const
    for (const tt of compoundToks) {
      if (this.check(tt) && this.isAssignable(left)) {
        const op = this.advance().value  // '+=', '-=', etc.
        const right = this.parseExpr()
        return { kind: 'BinaryExpr', op, left, right }
      }
    }
    return left
  }

  private isAssignable(expr: Expr): boolean {
    return expr.kind === 'Identifier' || expr.kind === 'MemberExpr' || expr.kind === 'IndexExpr'
  }

  // v0.4: pipeline supports |> as name steps
  private parsePipeline(): Expr {
    const steps: (Expr | PipeAsStep)[] = [this.parseTernary()]
    while (this.check('PIPE_OP')) {
      this.advance()
      // v0.4: |> as name — bind current value to name, pass through
      if (this.check('KW_AS')) {
        this.advance()
        const name = this.expect('IDENT').value
        steps.push({ kind: 'PipeAs', name })
      } else {
        steps.push(this.parseTernary())
      }
    }
    if (steps.length === 1) return steps[0] as Expr
    return { kind: 'PipelineExpr', steps }
  }

  // v0.4: ternary now wraps nullish, so ?? has higher precedence than ?:
  // v0.6: if `?` and the NEXT token are on DIFFERENT lines, treat as Result
  //        propagation postfix (expr?) rather than ternary (cond ? a : b).
  //        This allows `let n = parse_int(s)?` with the body on the next line.
  private parseTernary(): Expr {
    const test = this.parseNullish()
    if (this.check('QUESTION')) {
      const questionLine = this.tokens[this.pos].line
      const afterLine    = this.tokens[this.pos + 1]?.line ?? questionLine + 1
      if (afterLine > questionLine) {
        // Propagation postfix: ? is the last thing on its line
        this.advance()
        return { kind: 'ResultPropagateExpr', value: test }
      }
      // Ternary
      this.advance()
      const consequent = this.parseExpr()
      this.expect('COLON')
      const alternate = this.parseExpr()
      return { kind: 'TernaryExpr', test, consequent, alternate }
    }
    return test
  }

  // v0.6: Also allow explicit ? in a statement-boundary position for same-line
  // propagation: `let n = parse_int(s)?` where ? is followed by ; or }
  private tryPropagation(expr: Expr): Expr {
    if (this.check('QUESTION')) {
      this.advance()
      return { kind: 'ResultPropagateExpr', value: expr }
    }
    return expr
  }

  // v0.4: ?? nullish coalescing — lower precedence than ||, higher than ?:
  private parseNullish(): Expr {
    let left = this.parseOr()
    while (this.check('NULL_COALESCE')) {
      this.advance()
      left = { kind: 'BinaryExpr', op: '??', left, right: this.parseOr() }
    }
    return left
  }

  private parseOr(): Expr {
    let left = this.parseAnd()
    while (this.check('OR')) {
      const op = this.advance().value
      left = { kind: 'BinaryExpr', op, left, right: this.parseAnd() }
    }
    return left
  }

  private parseAnd(): Expr {
    let left = this.parseEquality()
    while (this.check('AND')) {
      const op = this.advance().value
      left = { kind: 'BinaryExpr', op, left, right: this.parseEquality() }
    }
    return left
  }

  private parseEquality(): Expr {
    let left = this.parseRelational()
    while (this.check('EQ') || this.check('NEQ') || this.check('STRICT_EQ') || this.check('STRICT_NEQ')) {
      const op = this.advance().value
      left = { kind: 'BinaryExpr', op, left, right: this.parseRelational() }
    }
    return left
  }

  private parseRelational(): Expr {
    let left = this.parseAdditive()
    while (this.check('LT') || this.check('GT') || this.check('LTE') || this.check('GTE') || this.check('KW_INSTANCEOF')) {
      const op = this.advance().value
      left = { kind: 'BinaryExpr', op, left, right: this.parseAdditive() }
    }
    return left
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative()
    while (this.check('PLUS') || this.check('MINUS')) {
      const op = this.advance().value
      left = { kind: 'BinaryExpr', op, left, right: this.parseMultiplicative() }
    }
    return left
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary()
    while (this.check('STAR') || this.check('SLASH') || this.check('PERCENT')) {
      const op = this.advance().value
      left = { kind: 'BinaryExpr', op, left, right: this.parseUnary() }
    }
    return left
  }

  private parseUnary(): Expr {
    if (this.check('BANG')) {
      this.advance()
      return { kind: 'UnaryExpr', op: '!', operand: this.parseUnary(), prefix: true }
    }
    if (this.check('MINUS')) {
      this.advance()
      return { kind: 'UnaryExpr', op: '-', operand: this.parseUnary(), prefix: true }
    }
    if (this.check('KW_TYPEOF')) {
      this.advance()
      return { kind: 'UnaryExpr', op: 'typeof', operand: this.parseUnary(), prefix: true }
    }
    // v0.8: await expr — resolves a Promise; only valid inside async functions
    if (this.check('KW_AWAIT')) {
      this.advance()
      const value = this.parseUnary()
      return { kind: 'AwaitExpr', value } as AwaitExpr
    }
    return this.parsePostfix()
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary()

    while (true) {
      // v0.4: optional chaining ?. — handles ?.prop, ?.[index], ?.()
      if (this.check('OPTIONAL_CHAIN')) {
        this.advance()
        if (this.check('LBRACKET')) {
          // ?.[index]
          this.advance()
          const index = this.parseExpr()
          this.expect('RBRACKET')
          expr = { kind: 'IndexExpr', object: expr, index, optional: true }
        } else if (this.check('LPAREN')) {
          // ?.()
          this.advance()
          const args = this.parseArgList()
          this.expect('RPAREN')
          expr = { kind: 'CallExpr', callee: expr, args, optional: true }
        } else {
          // ?.prop
          const prop = this.expectIdentOrKeyword().value
          expr = { kind: 'MemberExpr', object: expr, property: prop, optional: true }
        }
        continue
      }
      if (this.check('DOT')) {
        this.advance()
        const prop = this.expectIdentOrKeyword().value
        expr = { kind: 'MemberExpr', object: expr, property: prop }
        continue
      }
      if (this.check('LBRACKET')) {
        this.advance()
        const index = this.parseExpr()
        this.expect('RBRACKET')
        expr = { kind: 'IndexExpr', object: expr, index }
        continue
      }
      if (this.check('LPAREN')) {
        this.advance()
        const args = this.parseArgList()
        this.expect('RPAREN')
        expr = { kind: 'CallExpr', callee: expr, args }
        continue
      }
      break
    }
    return expr
  }

  private parseArgList(): Expr[] {
    const args: Expr[] = []
    while (!this.check('RPAREN') && !this.isEOF()) {
      if (this.check('SPREAD')) {
        this.advance()
        args.push({ kind: 'SpreadExpr', argument: this.parseExpr() })
      } else {
        args.push(this.parseExpr())
      }
      this.tryConsume('COMMA')
    }
    return args
  }

  private parsePrimary(): Expr {
    const tok = this.peek()

    if (tok.type === 'NUMBER') {
      this.advance()
      // v0.9.5: preserve raw source for hex/binary output; Number() handles 0x, 0b, decimals
      return { kind: 'NumberLit', value: Number(tok.value), raw: tok.value }
    }

    if (tok.type === 'STRING') {
      this.advance()
      return { kind: 'StringLit', value: tok.value, raw: JSON.stringify(tok.value) }
    }

    if (tok.type === 'TEMPLATE') {
      this.advance()
      return { kind: 'TemplateLit', raw: tok.value }
    }

    if (tok.type === 'KW_TRUE')  { this.advance(); return { kind: 'BoolLit', value: true } }
    if (tok.type === 'KW_FALSE') { this.advance(); return { kind: 'BoolLit', value: false } }

    if (tok.type === 'REGEX') {
      this.advance()
      const m = tok.value.match(/^\/(.*)\/([gimsuy]*)$/)
      return { kind: 'RegexLit', pattern: m?.[1] ?? '', flags: m?.[2] ?? '' }
    }

    if (tok.type === 'KW_MATCH') return this.parseMatch()
    // if used as a value expression: if cond { a } else { b }
    // stmtMode=false → tail-position ExprStmts inside each branch become ReturnStmts,
    // then the BlockExpr wrapper is emitted as an IIFE: (() => { if (...) { return a } else { return b } })()
    if (tok.type === 'KW_IF') {
      const ifStmt = this.parseIfStmt(false)
      return { kind: 'BlockExpr', stmts: [ifStmt] }
    }
    if (tok.type === 'LBRACE')   return this.parseObjectLit()
    if (tok.type === 'LBRACKET') return this.parseArrayLit()
    if (tok.type === 'LPAREN')   return this.parseParenOrLambda()

    // .fieldName accessor shorthand → implicit lambda __x => __x.fieldName
    if (tok.type === 'DOT') {
      this.advance()
      const field = this.expectIdentOrKeyword()
      let body: Expr = { kind: 'MemberExpr', object: { kind: 'Identifier', name: '__x' }, property: field.value }
      while (this.check('DOT')) {
        this.advance()
        const sub = this.expectIdentOrKeyword()
        body = { kind: 'MemberExpr', object: body, property: sub.value }
      }
      return { kind: 'LambdaExpr', params: ['__x'], body }
    }

    if (tok.type === 'KW_NEW') {
      this.advance()
      const callee = this.parsePostfix()
      return { kind: 'NewExpr', callee, args: [] }
    }

    if (tok.type === 'IDENT') {
      // Bare `ident =>` lambda — disabled inside when guards to avoid ambiguity
      // with the match arm separator. Use `(ident) =>` inside guards if needed.
      if (!this.inMatchGuard && this.tokens[this.pos + 1]?.type === 'FAT_ARROW') {
        const param = this.advance().value
        this.advance() // =>
        const body = this.parseLambdaBody()
        return { kind: 'LambdaExpr', params: [param], body }
      }
      this.advance()
      return { kind: 'Identifier', name: tok.value }
    }

    if (tok.type === 'UNDERSCORE') {
      this.advance()
      return { kind: 'Identifier', name: '_' }
    }

    if (tok.type === 'SPREAD') {
      this.advance()
      return { kind: 'SpreadExpr', argument: this.parseExpr() }
    }

    throw new ParseError(`Unexpected token: ${tok.type} ("${tok.value}")`, tok.line, tok.col)
  }

  // ── Match expression ─────────────────────────────────────────────────────────

  private parseMatch(): Expr {
    this.expect('KW_MATCH')
    const subject = this.parsePostfix()
    this.expect('LBRACE')
    const arms: MatchArm[] = []
    while (!this.check('RBRACE') && !this.isEOF()) {
      this.expect('PIPE')
      const pattern = this.parsePattern()
      // v0.4: optional when guard — | pat when expr => body
      // inMatchGuard prevents bare `ident =>` from being parsed as a lambda
      // (since => is the match arm separator that immediately follows the guard)
      let guard: Expr | undefined
      if (this.check('KW_WHEN')) {
        this.advance()
        this.inMatchGuard = true
        guard = this.parseOr()
        this.inMatchGuard = false
      }
      this.expect('FAT_ARROW')
      const body = this.parseExpr()
      arms.push({ pattern, guard, body })
      this.tryConsume('COMMA')
    }
    this.expect('RBRACE')
    return { kind: 'MatchExpr', subject, arms }
  }

  private parsePattern(): MatchPattern {
    const tok = this.peek()

    if (tok.type === 'UNDERSCORE' || (tok.type === 'IDENT' && tok.value === '_')) {
      this.advance(); return { kind: 'WildcardPat' }
    }

    if (tok.type === 'LT' || tok.type === 'GT' || tok.type === 'LTE' || tok.type === 'GTE' || tok.type === 'NEQ') {
      const op = this.advance().value
      const valTok = this.peek()
      if (valTok.type === 'NUMBER') { this.advance(); return { kind: 'ComparePat', op, value: parseFloat(valTok.value) } }
      if (valTok.type === 'STRING') { this.advance(); return { kind: 'ComparePat', op, value: valTok.value } }
      if (valTok.type === 'IDENT')  { this.advance(); return { kind: 'ComparePat', op, value: valTok.value } }
    }

    if (tok.type === 'KW_TRUE')  { this.advance(); return { kind: 'LiteralPat', value: true } }
    if (tok.type === 'KW_FALSE') { this.advance(); return { kind: 'LiteralPat', value: false } }
    if (tok.type === 'NUMBER') { this.advance(); return { kind: 'LiteralPat', value: parseFloat(tok.value) } }
    if (tok.type === 'STRING') { this.advance(); return { kind: 'LiteralPat', value: tok.value } }

    // v0.9.5: Enum.Variant pattern — IDENT DOT IDENT (e.g. Direction.North)
    if (tok.type === 'IDENT' && this.tokens[this.pos + 1]?.type === 'DOT' &&
        this.tokens[this.pos + 2]?.type === 'IDENT') {
      const enumName = this.advance().value
      this.advance() // consume '.'
      const variant = this.expect('IDENT').value
      return { kind: 'EnumPat', enumName, variant }
    }

    // v0.4: identifier followed by { bindings } → tagged union pattern
    if (tok.type === 'IDENT') {
      const name = this.advance().value
      if (this.check('LBRACE')) {
        this.advance()
        const bindings: string[] = []
        while (!this.check('RBRACE') && !this.isEOF()) {
          bindings.push(this.expect('IDENT').value)
          this.tryConsume('COMMA')
        }
        this.expect('RBRACE')
        return { kind: 'TagPat', name, bindings }
      }
      return { kind: 'IdentPat', name }
    }

    return { kind: 'WildcardPat' }
  }

  // ── Object literal ────────────────────────────────────────────────────────────

  private parseObjectLit(): Expr {
    this.expect('LBRACE')
    const properties: ObjectProperty[] = []
    while (!this.check('RBRACE') && !this.isEOF()) {
      if (this.check('SPREAD')) {
        this.advance()
        const arg = this.parseExpr()
        properties.push({ kind: 'ObjectProperty', key: '_spread_', value: arg, spread: true })
        this.tryConsume('COMMA')
        continue
      }

      if (this.check('LBRACKET')) {
        this.advance()
        const key = this.parseExpr()
        this.expect('RBRACKET')
        this.expect('COLON')
        const value = this.parseExpr()
        properties.push({ kind: 'ObjectProperty', key, value, computed: true })
        this.tryConsume('COMMA')
        continue
      }

      const keyTok = this.peek()
      let key: string
      if (keyTok.type === 'IDENT' || keyTok.type === 'STRING') {
        key = this.advance().value
      } else if (keyTok.type === 'KW_LET' || keyTok.type === 'KW_FN') {
        key = this.advance().value
      } else {
        key = this.advance().value
      }

      if (this.check('COLON')) {
        this.advance()
        const value = this.parseExpr()
        properties.push({ kind: 'ObjectProperty', key, value })
      } else {
        properties.push({ kind: 'ObjectProperty', key, value: { kind: 'Identifier', name: key }, shorthand: true })
      }
      this.tryConsume('COMMA')
    }
    this.expect('RBRACE')
    return { kind: 'ObjectLit', properties }
  }

  // ── Array literal ─────────────────────────────────────────────────────────────

  private parseArrayLit(): Expr {
    this.expect('LBRACKET')
    const elements: Expr[] = []
    while (!this.check('RBRACKET') && !this.isEOF()) {
      if (this.check('SPREAD')) {
        this.advance()
        elements.push({ kind: 'SpreadExpr', argument: this.parseExpr() })
      } else {
        elements.push(this.parseExpr())
      }
      this.tryConsume('COMMA')
    }
    this.expect('RBRACKET')
    return { kind: 'ArrayLit', elements }
  }

  // ── Parenthesised expr or lambda ──────────────────────────────────────────────

  private parseParenOrLambda(): Expr {
    if (this.isLambdaAhead()) {
      this.advance() // (
      const params: LambdaParam[] = []
      while (!this.check('RPAREN') && !this.isEOF()) {
        const spread = !!this.tryConsume('SPREAD')

        if (this.check('LBRACKET')) {
          this.advance()
          const names: string[] = []
          while (!this.check('RBRACKET') && !this.isEOF()) {
            names.push(this.expect('IDENT').value)
            this.tryConsume('COMMA')
          }
          this.expect('RBRACKET')
          params.push({ name: `[${names.join(', ')}]`, destructure: true })
          this.tryConsume('COMMA')
          continue
        }

        if (this.check('LBRACE')) {
          this.advance()
          const names: string[] = []
          while (!this.check('RBRACE') && !this.isEOF()) {
            names.push(this.expect('IDENT').value)
            this.tryConsume('COMMA')
          }
          this.expect('RBRACE')
          params.push({ name: `{ ${names.join(', ')} }`, destructure: true })
          this.tryConsume('COMMA')
          continue
        }

        const name = this.expect('IDENT').value
        if (this.check('COLON')) {
          this.advance(); this.parseTypeExpr()
        }
        params.push(spread ? { name, destructure: true } : name)
        this.tryConsume('COMMA')
      }
      this.expect('RPAREN')
      this.expect('FAT_ARROW')
      const body = this.parseLambdaBody()
      return { kind: 'LambdaExpr', params, body }
    }

    this.expect('LPAREN')
    const expr = this.parseExpr()
    this.expect('RPAREN')
    return expr
  }

  private parseLambdaBody(): Expr {
    if (this.check('LBRACE')) {
      this.advance()
      const body = this.parseBlockBody()
      this.expect('RBRACE')
      if (body.kind !== 'BlockExpr') {
        return { kind: 'BlockExpr', stmts: [{ kind: 'ReturnStmt', value: body }] }
      }
      return body
    }
    return this.parseExpr()
  }

  private isLambdaAhead(): boolean {
    let i = this.pos + 1 // skip (
    let depth = 1
    while (i < this.tokens.length && depth > 0) {
      if (this.tokens[i].type === 'LPAREN') depth++
      if (this.tokens[i].type === 'RPAREN') depth--
      i++
    }
    return this.tokens[i]?.type === 'FAT_ARROW'
  }

  // ── Token helpers ────────────────────────────────────────────────────────────

  private peek(): Token { return this.tokens[this.pos] ?? { type: 'EOF', value: '', line: 0, col: 0 } }

  private advance(): Token {
    const tok = this.tokens[this.pos]
    this.pos++
    return tok
  }

  private check(type: TokenType): boolean { return this.peek().type === type }

  private expect(type: TokenType): Token {
    const tok = this.peek()
    if (tok.type !== type) {
      throw new ParseError(`Expected ${type}, got ${tok.type} ("${tok.value}")`, tok.line, tok.col)
    }
    return this.advance()
  }

  private tryConsume(type: TokenType): Token | null {
    if (this.check(type)) return this.advance()
    return null
  }

  private isEOF(): boolean { return this.peek().type === 'EOF' }

  private expectIdentOrKeyword(): Token {
    const tok = this.peek()
    if (tok.type === 'IDENT' || tok.type.startsWith('KW_')) return this.advance()
    throw new ParseError(`Expected identifier, got ${tok.type} ("${tok.value}")`, tok.line, tok.col)
  }
}
