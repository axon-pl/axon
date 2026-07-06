// ─────────────────────────────────────────────────────────────────────────────
// Synth v0.9.5 — JavaScript code generator
// Walks the AST and emits clean, idiomatic JS with JSDoc annotations.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Program, TopLevelDecl,
  TypeAlias, TaggedUnionDecl, TestDecl,
  RecordDecl, FnDecl, ModuleDecl,
  ImportDecl, ExportDecl,
  StoreDecl, EnumDecl, TopLevelStmt,
  Annotation, FnParam, TypeExpr,
  Expr, BlockExpr, BlockStmt,
  MatchExpr, MatchArm, MatchPattern,
  ObjectProperty, LambdaParam,
  Constraint, PipeAsStep,
} from './types.js'
import { SYNTH_STDLIB } from './stdlib.js'

// Method-syntax stdlib calls: value.method(args) → synth_method(value, args)
const STDLIB_METHODS = new Set([
  'trim', 'split', 'starts_with', 'ends_with', 'contains', 'to_upper', 'to_lower',
  'replace_all', 'pad_start', 'pad_end',
  'map', 'filter', 'fold', 'zip', 'first', 'last', 'sum', 'count', 'any', 'all',
  'flat', 'flat_map', 'take', 'drop', 'uniq', 'chunk', 'set_at', 'reverse',
  'sum_by', 'min', 'max', 'min_by', 'max_by', 'sort_by', 'sort_by_desc',
  'is_ok', 'is_err', 'unwrap', 'unwrap_or',
])

// All stdlib identifiers — prefixed synth_* in output to avoid global collisions
const STDLIB_ALL = new Set([
  'map', 'filter', 'fold', 'pipe', 'zip', 'range', 'first', 'last', 'sum', 'count',
  'any', 'all', 'flat', 'flat_map', 'groupBy', 'pick', 'omit',
  'sort_by', 'sort_by_desc',
  'trim', 'split', 'starts_with', 'ends_with', 'contains', 'to_upper', 'to_lower',
  'replace_all', 'pad_start', 'pad_end',
  'min', 'max', 'min_by', 'max_by',
  'take', 'drop', 'uniq', 'chunk', 'set_at', 'reverse', 'sum_by',
  'clamp', 'abs', 'round', 'floor', 'ceil', 'pow', 'sqrt', 'random', 'random_int',
  'ok', 'err', 'is_ok', 'is_err', 'unwrap', 'unwrap_or',
  'delay', 'println',
])

export class Codegen {
  private out: string[] = []
  private indent = 0
  private propagateCounter = 0   // unique temp-var IDs for ? propagation
  private validatedTypes: Set<string> = new Set()
  // v0.4: track known union variant names for tag pattern matching
  private unionVariants: Map<string, string[]> = new Map()

  generate(program: Program, emitStdlib = false): string {
    // Pre-pass: collect constrained types and tagged union variants
    for (const decl of program.body) {
      if (decl.kind === 'TypeAlias' && decl.constraint) {
        this.validatedTypes.add(decl.name)
      }
      if (decl.kind === 'TaggedUnionDecl') {
        this.unionVariants.set(decl.name, decl.variants.map(v => v.name))
      }
      // v0.5: exported tagged unions / type aliases are also registered
      if (decl.kind === 'ExportDecl') {
        if (decl.decl.kind === 'TaggedUnionDecl') {
          this.unionVariants.set(decl.decl.name, decl.decl.variants.map(v => v.name))
        }
        if (decl.decl.kind === 'TypeAlias' && decl.decl.constraint) {
          this.validatedTypes.add(decl.decl.name)
        }
      }
      if (decl.kind === 'ModuleDecl') {
        for (const inner of decl.body) {
          if (inner.kind === 'TypeAlias' && inner.constraint) {
            this.validatedTypes.add(inner.name)
          }
        }
      }
    }

    if (emitStdlib) this.out.push(SYNTH_STDLIB)

    for (const decl of program.body) {
      this.emitTopLevel(decl)
      this.emitLine('')
    }

    return this.out.join('')
  }

  // ── Top-level declarations ───────────────────────────────────────────────────

  private emitTopLevel(decl: TopLevelDecl): void {
    switch (decl.kind) {
      case 'TypeAlias':       this.emitTypeAlias(decl);    break
      case 'TaggedUnionDecl': this.emitTaggedUnion(decl);  break
      case 'RecordDecl':      this.emitRecord(decl);       break
      case 'FnDecl':          this.emitFn(decl);           break
      case 'ModuleDecl':      this.emitModule(decl);       break
      case 'TestDecl':        this.emitTest(decl);         break
      // v0.5: imports are resolved by the CLI bundler before codegen — skip here
      case 'ImportDecl':      break
      // v0.5: export is a source-level modifier; bundled output has no ES module syntax
      case 'ExportDecl':      this.emitTopLevel(decl.decl); break
      // v0.5: bare top-level expression statement (e.g. mount())
      case 'TopLevelExpr':    this.emitLine(`${this.emitExpr(decl.expr)};`); break
      // v0.5: top-level let binding (e.g. let state = {...})
      case 'TopLevelLet': {
        const val = this.emitExpr(decl.value)
        if (decl.name) this.emitLine(`let ${decl.name} = ${val};`)
        else           this.emitLine(`${val};`)
        break
      }
      // v0.5.2: top-level for loop / statement
      case 'TopLevelStmt':
        this.emitStmt((decl as TopLevelStmt).stmt)
        break
      // v0.8: store — reactive mutable state as IIFE with subscribe/set API
      case 'StoreDecl':
        this.emitStore(decl as StoreDecl)
        break
      // v0.9.5: enum — frozen object of string-valued members
      case 'EnumDecl':
        this.emitEnum(decl as EnumDecl)
        break
      // v0.7: interface is type-level only — emit as a JSDoc @interface comment
      case 'InterfaceDecl': {
        const tp = decl.typeParams?.length ? `<${decl.typeParams.join(', ')}>` : ''
        this.emitLine(`/** @interface ${decl.name}${tp}`)
        for (const f of decl.fields) {
          this.emitLine(` * @property {${this.typeToJS(f.type)}} ${f.name}`)
        }
        this.emitLine(` */`)
        break
      }
    }
  }

  private emitTypeAlias(decl: TypeAlias): void {
    this.emitLine(`/** @typedef {${this.typeToJS(decl.type)}} ${decl.name} */`)
    if (decl.constraint) {
      this.emitConstraintValidator(decl.name, decl.type, decl.constraint)
    }
  }

  // v0.4: emit factory functions for each variant of a tagged union.
  // Unit variants → frozen constant object.
  // Payload variants → factory function returning a frozen object.
  private emitTaggedUnion(decl: TaggedUnionDecl): void {
    this.emitLine(`// Tagged union: ${decl.name}`)
    for (const v of decl.variants) {
      if (v.fields.length === 0) {
        // Unit variant: Point → frozen constant
        this.emitLine(`const ${v.name} = Object.freeze({ tag: "${v.name}" });`)
      } else {
        // Payload variant: Circle { r } → factory function
        const params = v.fields.map(f => f.name).join(', ')
        const fields = v.fields.map(f => f.name).join(', ')
        this.emitLine(`const ${v.name} = (${params}) => Object.freeze({ tag: "${v.name}", ${fields} });`)
      }
    }
  }

  // v0.4: emit a test registration call.
  // Tests are registered in __synth_tests (initialized in stdlib).
  private emitTest(decl: TestDecl): void {
    const desc = JSON.stringify(decl.description)
    const body = this.emitExpr(decl.body)
    this.emitLine(`__synth_tests.push({ desc: ${desc}, fn: () => ${body} });`)
  }

  private emitConstraintValidator(typeName: string, baseType: TypeExpr, constraint: Constraint): void {
    const fnName = `__validate_${typeName}`
    const predicate = this.constraintToPredicate(constraint, 'v')
    this.emitLine(`/** @param {${this.typeToJS(baseType)}} v @returns {boolean} */`)
    this.emitLine(`const ${fnName} = (v) => ${predicate};`)
  }

  private constraintToPredicate(c: Constraint, v: string): string {
    switch (c.kind) {
      case 'CompareConstraint':
        return typeof c.value === 'string'
          ? `${v} ${c.op} "${c.value}"`
          : `${v} ${c.op} ${c.value}`
      case 'LengthConstraint':
        return `${v}.length ${c.op} ${c.value}`
      case 'MatchesConstraint':
        return `__synth_presets.${c.preset}.test(${v})`
      case 'RegexConstraint':
        return `/${c.pattern}/${c.flags}.test(${v})`
      case 'AndConstraint':
        return `(${this.constraintToPredicate(c.left, v)}) && (${this.constraintToPredicate(c.right, v)})`
      case 'OrConstraint':
        return `(${this.constraintToPredicate(c.left, v)}) || (${this.constraintToPredicate(c.right, v)})`
      case 'NotConstraint':
        return `!(${this.constraintToPredicate(c.inner, v)})`
      case 'CustomConstraint':
        return this.emitExpr(c.expr).replace(/\bvalue\b/g, v)
    }
  }

  private emitRecord(decl: RecordDecl): void {
    const lines = [`/** @typedef {{`]
    decl.fields.forEach((f, i) => {
      const comma = i < decl.fields.length - 1 ? ',' : ''
      lines.push(` *   ${f.name}: ${this.typeToJS(f.type)}${comma}`)
    })
    lines.push(` * }} ${decl.name}`)
    lines.push(` */`)
    lines.forEach(l => this.emitLine(l))
    // Emit a positional constructor factory unless a tagged-union variant with
    // the same name already exists (it will emit its own constructor).
    const isUnionVariant = [...this.unionVariants.values()].some(vs => vs.includes(decl.name))
    if (!isUnionVariant) {
      const params = decl.fields.map(f => f.name).join(', ')
      const body   = decl.fields.map(f => f.name).join(', ')
      this.emitLine(`const ${decl.name} = (${params}) => ({ ${body} });`)
    }
  }

  // v0.8: emit a reactive store as a self-contained IIFE with get/set/subscribe API.
  // store Counter { count: int = 0 } →
  //   const Counter = (() => {
  //     let _state = { count: 0 };
  //     const _subs = [];
  //     return {
  //       get count() { return _state.count; },
  //       set(patch) { _state = Object.assign({}, _state, patch); for (const fn of _subs) fn(_state); },
  //       subscribe(fn) { _subs.push(fn); fn(_state); }
  //     };
  //   })();
  private emitStore(decl: StoreDecl): void {
    const fieldNames = decl.fields.map(f => f.name)
    const defaults = decl.fields.map(f => `${f.name}: ${this.emitExpr(f.default)}`).join(', ')
    this.emitLine(`/** @store ${decl.name} — reactive state boundary (v0.8) */`)
    this.emitLine(`const ${decl.name} = (() => {`)
    this.indent++
    this.emitLine(`let _state = { ${defaults} };`)
    this.emitLine(`const _subs = [];`)
    this.emitLine(`return {`)
    this.indent++
    for (const name of fieldNames) {
      this.emitLine(`get ${name}() { return _state.${name}; },`)
    }
    this.emitLine(`set(patch) {`)
    this.indent++
    this.emitLine(`_state = Object.assign({}, _state, patch);`)
    this.emitLine(`for (const __fn of _subs) __fn(_state);`)
    this.indent--
    this.emitLine(`},`)
    this.emitLine(`subscribe(fn) { _subs.push(fn); fn(_state); },`)
    this.indent--
    this.emitLine(`};`)
    this.indent--
    this.emitLine(`})();`)
  }

  // v0.9.5: enum Color = Red | Green | Blue
  // → const Color = Object.freeze({ Red: 'Red', Green: 'Green', Blue: 'Blue' });
  private emitEnum(decl: EnumDecl): void {
    const members = decl.variants.map(v => `${v}: '${v}'`).join(', ')
    this.emitLine(`/** @enum {string} ${decl.name} */`)
    this.emitLine(`const ${decl.name} = Object.freeze({ ${members} });`)
  }

  private emitFn(decl: FnDecl): void {
    const paramStr = decl.params.map(p => p.spread ? `...${p.name}` : p.name).join(', ')
    const asyncPrefix = decl.isAsync ? 'async ' : ''

    if (decl.shortForm) {
      const exprStr = this.emitExpr(decl.body)
      const wrapped = this.arrowBodyWrap(decl.body, exprStr)
      this.emitLine(`const ${decl.name} = ${asyncPrefix}(${paramStr}) => ${wrapped};`)
      return
    }

    this.emitJSDoc(decl.annotations, decl.params, decl.returnType, decl.isAsync ?? false)

    const paramValidations = this.getParamValidations(decl.params)

    const hasMemo = decl.annotations.some(a => a.name === 'memo')
    if (hasMemo) {
      this.emitMemoFn(decl, paramStr, paramValidations)
      return
    }

    const body = decl.body
    if (body.kind === 'BlockExpr' || paramValidations.length > 0) {
      this.emitLine(`const ${decl.name} = ${asyncPrefix}(${paramStr}) => {`)
      this.indent++
      for (const v of paramValidations) this.emitLine(v)
      if (body.kind === 'BlockExpr') {
        this.emitBlock(body)
      } else {
        const exprStr = this.emitExpr(body)
        this.emitLine(`return ${this.arrowBodyWrap(body, exprStr)};`)
      }
      this.indent--
      this.emitLine(`};`)
    } else {
      const exprStr = this.emitExpr(body)
      const wrapped = this.arrowBodyWrap(body, exprStr)
      if (exprStr.includes('\n')) {
        this.emitLine(`const ${decl.name} = ${asyncPrefix}(${paramStr}) => {`)
        this.indent++
        this.emitLine(`return ${wrapped};`)
        this.indent--
        this.emitLine(`};`)
      } else {
        this.emitLine(`const ${decl.name} = ${asyncPrefix}(${paramStr}) => ${wrapped};`)
      }
    }
  }

  private emitMemoFn(decl: FnDecl, paramStr: string, paramValidations: string[]): void {
    const paramNames = decl.params.map(p => p.name)
    this.emitLine(`const ${decl.name} = (() => {`)
    this.indent++
    this.emitLine(`const __cache = new Map();`)
    this.emitLine(`return (${paramStr}) => {`)
    this.indent++
    for (const v of paramValidations) this.emitLine(v)
    this.emitLine(`const __key = JSON.stringify([${paramNames.join(', ')}]);`)
    this.emitLine(`if (__cache.has(__key)) return __cache.get(__key);`)
    this.emitLine(`const __result = (() => {`)
    this.indent++
    if (decl.body.kind === 'BlockExpr') {
      this.emitBlock(decl.body)
    } else {
      const exprStr = this.emitExpr(decl.body)
      this.emitLine(`return ${exprStr};`)
    }
    this.indent--
    this.emitLine(`})();`)
    this.emitLine(`__cache.set(__key, __result);`)
    this.emitLine(`return __result;`)
    this.indent--
    this.emitLine(`};`)
    this.indent--
    this.emitLine(`})();`)
  }

  private getParamValidations(params: FnParam[]): string[] {
    const guards: string[] = []
    for (const p of params) {
      if (p.spread) continue
      const typeName = p.type?.name
      if (typeName && this.validatedTypes.has(typeName)) {
        guards.push(
          `if (!__validate_${typeName}(${p.name})) ` +
          `throw new Error(\`SynthConstraintError: ${p.name} violates ${typeName} constraint (got \${JSON.stringify(${p.name})})\`);`
        )
      }
    }
    return guards
  }

  private emitModule(decl: ModuleDecl): void {
    const exposes = decl.annotations.find(a => a.name === 'exposes')
    this.emitLine(`// Module: ${decl.name}`)
    for (const item of decl.body) {
      this.emitTopLevel(item)
    }
    if (exposes && Array.isArray(exposes.value)) {
      const exports = exposes.value.join(', ')
      this.emitLine(`const ${decl.name} = { ${exports} };`)
    }
  }

  // ── JSDoc emitter ────────────────────────────────────────────────────────────

  private emitJSDoc(anns: Annotation[], params: FnParam[], returnType: TypeExpr, isAsync = false): void {
    const intent  = anns.find(a => a.name === 'intent')
    const effects = anns.find(a => a.name === 'effects')
    const pure    = anns.find(a => a.name === 'pure')
    const total   = anns.find(a => a.name === 'total')

    const lines: string[] = []
    if (intent) lines.push(` * ${intent.value}`)
    if (isAsync) lines.push(` * @async`)
    if (pure)   lines.push(` * @pure — no side effects`)
    if (total)  lines.push(` * @total — always returns, never throws`)
    if (effects && Array.isArray(effects.value)) {
      const effectStr = this.joinDotNotation(effects.value)
      lines.push(` * @effects ${effectStr}`)
    }
    params.forEach(p => {
      lines.push(` * @param {${this.typeToJS(p.type)}} ${p.spread ? '...' : ''}${p.name}`)
    })
    lines.push(` * @returns {${this.typeToJS(returnType)}}`)

    if (lines.length > 0) {
      this.emitLine(`/**`)
      lines.forEach(l => this.emitLine(l))
      this.emitLine(` */`)
    }
  }

  private joinDotNotation(tokens: string[]): string {
    const parts: string[] = []
    let current = ''
    for (const tok of tokens) {
      if (tok === '.') {
        current += '.'
      } else if (current.endsWith('.')) {
        current += tok
      } else {
        if (current) parts.push(current)
        current = tok
      }
    }
    if (current) parts.push(current)
    return parts.join(', ')
  }

  // ── Block body ───────────────────────────────────────────────────────────────

  private emitBlock(block: BlockExpr): void {
    for (const stmt of block.stmts) {
      this.emitStmt(stmt)
    }
  }

  private emitStmt(stmt: BlockStmt): void {
    switch (stmt.kind) {
      case 'LetStmt': {
        // v0.6: let x = expr?  →  guard + unwrap
        if (stmt.value.kind === 'ResultPropagateExpr') {
          const id  = this.propagateCounter++
          const tmp = `_r${id}`
          const inner = this.emitExpr(stmt.value.value)
          this.emitLine(`const ${tmp} = ${inner};`)
          this.emitLine(`if (${tmp}.tag === 'Err') return ${tmp};`)
          if (stmt.name !== null) this.emitLine(`let ${stmt.name} = ${tmp}.value;`)
        } else {
          const val = this.emitExpr(stmt.value)
          if (stmt.name === null) {
            this.emitLine(`${val};`)
          } else {
            this.emitLine(`let ${stmt.name} = ${val};`)
          }
        }
        break
        // Note: let mut emits the same JS `let` — JS `let` is already mutable.
        // The `mutable` flag is used by the checker to enforce Synth's immutability rules.
      }
      // v0.4: destructuring let { a, b } = expr  /  let [a, b] = expr
      case 'DestructureStmt': {
        const val = this.emitExpr(stmt.value)
        if (stmt.style === 'object') {
          this.emitLine(`const { ${stmt.names.join(', ')} } = ${val};`)
        } else {
          this.emitLine(`const [${stmt.names.join(', ')}] = ${val};`)
        }
        break
      }
      case 'ReturnStmt': {
        // v0.6: return expr?  →  guard + return unwrapped value
        if (stmt.value.kind === 'ResultPropagateExpr') {
          const id  = this.propagateCounter++
          const tmp = `_r${id}`
          const inner = this.emitExpr(stmt.value.value)
          this.emitLine(`const ${tmp} = ${inner};`)
          this.emitLine(`if (${tmp}.tag === 'Err') return ${tmp};`)
          this.emitLine(`return ${tmp}.value;`)
        } else {
          const val = this.emitExpr(stmt.value)
          this.emitLine(`return ${val};`)
        }
        break
      }
      case 'ExprStmt': {
        // v0.6: expr?  →  guard only, discard Ok value
        if (stmt.value.kind === 'ResultPropagateExpr') {
          const id  = this.propagateCounter++
          const tmp = `_r${id}`
          const inner = this.emitExpr(stmt.value.value)
          this.emitLine(`const ${tmp} = ${inner};`)
          this.emitLine(`if (${tmp}.tag === 'Err') return ${tmp};`)
        } else {
          const val = this.emitExpr(stmt.value)
          this.emitLine(`${val};`)
        }
        break
      }
      case 'IfStmt': {
        this.emitIfChain(stmt)
        break
      }
      // v0.5.2: for i in lo..hi { } / for i in lo..=hi { }
      case 'ForRangeStmt': {
        const lo  = this.emitExpr(stmt.lo)
        const hi  = this.emitExpr(stmt.hi)
        const op  = stmt.inclusive ? '<=' : '<'
        this.emitLine(`for (let ${stmt.varName} = ${lo}; ${stmt.varName} ${op} ${hi}; ${stmt.varName}++) {`)
        this.indent++
        this.emitBlock(stmt.body)
        this.indent--
        this.emitLine(`}`)
        break
      }
      // v0.5.2: for x in array { }  →  for...of
      case 'ForInStmt': {
        const iter = this.emitExpr(stmt.iter)
        this.emitLine(`for (const ${stmt.varName} of ${iter}) {`)
        this.indent++
        this.emitBlock(stmt.body)
        this.indent--
        this.emitLine(`}`)
        break
      }
      // v0.9.8: while condition { body }
      case 'WhileStmt': {
        const test = this.emitExpr(stmt.test)
        this.emitLine(`while (${test}) {`)
        this.indent++
        for (const s of stmt.body.stmts) this.emitStmt(s)
        this.indent--
        this.emitLine('}')
        break
      }
      case 'BreakStmt':    this.emitLine('break;');    break
      case 'ContinueStmt': this.emitLine('continue;'); break
      // v0.6: refine — emits a semantic comment; becomes a model-checked assertion in v1.0
      case 'RefineStmt':
        this.emitLine(`// refine ${stmt.name}: "${stmt.claim}"`)
        break
    }
  }

  // ── Expression emitter ───────────────────────────────────────────────────────

  private emitExpr(expr: Expr): string {
    switch (expr.kind) {
      case 'NumberLit':   return expr.raw ?? String(expr.value)
      case 'StringLit':   return this.emitString(expr.value, expr.raw)
      case 'TemplateLit': return expr.raw
      case 'BoolLit':     return String(expr.value)
      case 'RegexLit':    return `/${expr.pattern}/${expr.flags}`
      case 'NullLit':     return 'null'
      case 'RawJS':       return expr.code
      // v0.6: ResultPropagateExpr handled at statement level; if reached here it's
      // inside a sub-expression (e.g. pipeline) — emit as unwrap() for now
      case 'ResultPropagateExpr': return `synth_unwrap(${this.emitExpr(expr.value)})`
      // v0.8: await expr
      case 'AwaitExpr': return `await ${this.emitExpr(expr.value)}`
      case 'Identifier':  return STDLIB_ALL.has(expr.name) ? `synth_${expr.name}` : expr.name

      case 'UnaryExpr': {
        const unaryOp = expr.op === 'not' ? '!' : expr.op
        if (expr.prefix) {
          const needsSpace = /[a-z]/.test(unaryOp)
          return `${unaryOp}${needsSpace ? ' ' : ''}${this.emitExpr(expr.operand)}`
        }
        return `${this.emitExpr(expr.operand)}${unaryOp}`
      }

      case 'BinaryExpr': {
        if (expr.op === '=') {
          return `${this.emitExpr(expr.left)} = ${this.emitExpr(expr.right)}`
        }
        // v0.9.6: compound assignment — emit directly, no precedence wrapping needed
        if (/^(\+|-|\*|\/|%|\?\?)=$/.test(expr.op)) {
          return `${this.emitExpr(expr.left)} ${expr.op} ${this.emitExpr(expr.right)}`
        }
        const opAlias: Record<string, string> = { and: '&&', or: '||', not: '!' }
        const op = opAlias[expr.op] ?? expr.op
        const l = this.emitExprParenIfNeeded(expr.left, op)
        const r = this.emitExprParenIfNeeded(expr.right, op)
        return `${l} ${op} ${r}`
      }

      case 'TernaryExpr': {
        const t = this.emitExpr(expr.test)
        const c = this.emitExpr(expr.consequent)
        const a = this.emitExpr(expr.alternate)
        return `${t} ? ${c} : ${a}`
      }

      case 'MemberExpr': {
        const obj = this.emitExpr(expr.object)
        const opt = expr.optional ? '?.' : '.'
        return `${obj}${opt}${expr.property}`
      }

      case 'IndexExpr': {
        const obj = this.emitExpr(expr.object)
        const idx = this.emitExpr(expr.index)
        // v0.4: optional index — obj?.[idx]
        const opt = expr.optional ? '?.' : ''
        return `${obj}${opt}[${idx}]`
      }

      case 'CallExpr': {
        const args = expr.args.map(a => this.emitExpr(a)).join(', ')
        if (expr.callee.kind === 'Identifier' && expr.callee.name === 'print') {
          return `console.log(${args})`
        }
        if (expr.callee.kind === 'MemberExpr' && STDLIB_METHODS.has(expr.callee.property)) {
          const obj = this.emitExpr(expr.callee.object)
          const fn = `synth_${expr.callee.property}`
          return args ? `${fn}(${obj}, ${args})` : `${fn}(${obj})`
        }
        const callee = this.emitExpr(expr.callee)
        // v0.4: optional call — callee?.(args)
        if (expr.optional) return `${callee}?.(${args})`
        return `${callee}(${args})`
      }

      case 'NewExpr': {
        const callee = this.emitExpr(expr.callee)
        const args = expr.args.map(a => this.emitExpr(a)).join(', ')
        return `new ${callee}(${args})`
      }

      case 'SpreadExpr':
        return `...${this.emitExpr(expr.argument)}`

      case 'ArrayLit': {
        const elems = expr.elements.map(e => this.emitExpr(e)).join(', ')
        return `[${elems}]`
      }

      case 'ObjectLit': {
        if (expr.properties.length === 0) return '{}'
        const props = expr.properties.map(p => this.emitObjectProp(p))
        const inline = `{ ${props.join(', ')} }`
        return inline.length <= 80 ? inline : `{\n${props.map(p => '  ' + p).join(',\n')}\n}`
      }

      case 'LambdaExpr': {
        const params = this.emitLambdaParams(expr.params)
        const prefix = expr.isAsync ? 'async ' : ''
        if (expr.body.kind === 'BlockExpr') {
          const blockStr = this.captureBlock(expr.body)
          return `${prefix}(${params}) => {\n${blockStr}}`
        }
        const rawBody = this.emitExpr(expr.body)
        const body = this.arrowBodyWrap(expr.body, rawBody)
        const needsParens = params.length === 0 || params.includes(',') || params.includes(' ') || params.startsWith('[') || params.startsWith('{')
        return needsParens
          ? `${prefix}(${params}) => ${body}`
          : `${prefix}${params} => ${body}`
      }

      case 'PipelineExpr':
        return this.emitPipeline(expr.steps)

      case 'BlockExpr': {
        const savedOut = this.out
        this.out = []
        this.indent++
        this.emitBlock(expr)
        this.indent--
        const inner = this.out.join('')
        this.out = savedOut
        return '(() => {\n' + inner + '})()'
      }

      case 'DoExpr': {
        const hasAwait = this.blockHasAwait(expr.body)
        const savedOut = this.out
        this.out = []
        this.indent++
        this.emitBlock(expr.body)
        this.indent--
        const inner = this.out.join('')
        this.out = savedOut
        return hasAwait
          ? `(async () => {\n${inner}})()`
          : `(() => {\n${inner}})()`
      }

      case 'MatchExpr':
        return this.emitMatch(expr)
    }
  }

  private blockHasAwait(block: BlockExpr): boolean {
    const check = (expr: any): boolean => {
      if (!expr || typeof expr !== 'object') return false
      if (expr.kind === 'AwaitExpr') return true
      return Object.values(expr).some(v =>
        Array.isArray(v) ? v.some(check) : check(v)
      )
    }
    return block.stmts.some(check)
  }

  private emitObjectProp(prop: ObjectProperty): string {
    if (prop.spread) return `...${this.emitExpr(prop.value)}`
    if (prop.shorthand) return String(prop.key)
    if (prop.computed) return `[${this.emitExpr(prop.key as Expr)}]: ${this.emitExpr(prop.value)}`
    return `${prop.key}: ${this.emitExpr(prop.value)}`
  }

  private emitLambdaParams(params: LambdaParam[]): string {
    return params.map(p => {
      if (typeof p === 'string') return p
      return p.name
    }).join(', ')
  }

  // v0.4: pipeline emitter handles both functional composition AND |> as name IIFE form
  private emitPipeline(steps: (Expr | PipeAsStep)[]): string {
    const hasPipeAs = steps.some(s => (s as any).kind === 'PipeAs')

    if (!hasPipeAs) {
      // Original functional composition style
      return this.emitPipelineFunctional(steps as Expr[])
    }

    // IIFE block form: each step becomes a const binding; PipeAs names the current value
    const blockLines: string[] = []
    let acc = this.emitExpr(steps[0] as Expr)

    for (let i = 1; i < steps.length; i++) {
      const step = steps[i]
      if ((step as any).kind === 'PipeAs') {
        const name = (step as PipeAsStep).name
        blockLines.push(`const ${name} = ${acc};`)
        acc = name
      } else {
        acc = this.applyPipeStep(step as Expr, acc)
      }
    }

    const inner = blockLines.map(l => '  ' + l).join('\n')
    const sep = inner ? inner + '\n' : ''
    return `(() => {\n${sep}  return ${acc};\n})()`
  }

  private emitPipelineFunctional(steps: Expr[]): string {
    let acc = this.emitExpr(steps[0])
    for (let i = 1; i < steps.length; i++) {
      acc = this.applyPipeStep(steps[i], acc)
    }
    return acc
  }

  private applyPipeStep(step: Expr, acc: string): string {
    if (step.kind === 'Identifier') {
      return `${step.name}(${acc})`
    }
    if (step.kind === 'CallExpr') {
      const callee = this.emitExpr(step.callee)
      const extraArgs = step.args.map(a => this.emitExpr(a)).join(', ')
      return extraArgs ? `${callee}(${acc}, ${extraArgs})` : `${callee}(${acc})`
    }
    if (step.kind === 'LambdaExpr') {
      const lambda = this.emitExpr(step)
      return `(${lambda})(${acc})`
    }
    return `(${this.emitExpr(step)})(${acc})`
  }

  // Match expression → nested ternary chain
  private emitMatch(expr: MatchExpr): string {
    const subj = this.emitExpr(expr.subject)
    const subjVar = `_m`

    const buildChain = (arms: MatchArm[], idx: number): string => {
      if (idx >= arms.length) return 'undefined'
      const arm = arms[idx]
      const rest = buildChain(arms, idx + 1)

      // v0.4: lowercase IdentPat is a BINDING — bind subject to name, expose in guard + body.
      // e.g. | n when n >= 90 => "A"  →  ((n) => n >= 90 ? "A" : rest)(_m)
      if (arm.pattern.kind === 'IdentPat' && /^[a-z_$]/.test(arm.pattern.name) && arm.pattern.name !== '_') {
        const name = arm.pattern.name
        const rawBody = this.emitExpr(arm.body)
        if (arm.guard) {
          const g = this.emitExpr(arm.guard)
          return `((${name}) => (${g}) ? ${rawBody} : ${rest})(${subjVar})`
        }
        return `((${name}) => ${rawBody})(${subjVar})`
      }

      // v0.4: TagPat with field bindings — destructure fields, expose in guard + body.
      // e.g. | Circle { r } when r > 10 => "big" →  _m.tag==="Circle" ? (({r}) => r>10 ? "big" : rest)(_m) : ...
      if (arm.pattern.kind === 'TagPat' && arm.pattern.bindings.length > 0) {
        const cond = this.patternToCondition(arm.pattern, subjVar)
        const bindStr = arm.pattern.bindings.join(', ')
        const rawBody = this.emitExpr(arm.body)
        const innerExpr = arm.guard
          ? `(({ ${bindStr} }) => (${this.emitExpr(arm.guard)}) ? ${rawBody} : ${rest})(${subjVar})`
          : `(({ ${bindStr} }) => ${rawBody})(${subjVar})`
        return `(${cond}) ? ${innerExpr} : ${rest}`
      }

      // Standard pattern: build condition, optional guard, then body or rest
      let cond = this.patternToCondition(arm.pattern, subjVar)
      if (arm.guard) {
        const g = this.emitExpr(arm.guard)
        cond = cond === 'true' ? g : `(${cond}) && (${g})`
      }
      const body = this.emitExpr(arm.body)
      if (cond === 'true') return body
      return `(${cond}) ? ${body} : ${rest}`
    }

    const chain = buildChain(expr.arms, 0)
    return `((_m) => ${chain})(${subj})`
  }

  private patternToCondition(pat: MatchPattern, subj: string): string {
    switch (pat.kind) {
      case 'WildcardPat':  return 'true'
      case 'LiteralPat': {
        if (typeof pat.value === 'string') return `${subj} === "${pat.value}"`
        return `${subj} === ${pat.value}`
      }
      case 'ComparePat':
        return `${subj} ${pat.op} ${typeof pat.value === 'string' ? JSON.stringify(pat.value) : pat.value}`
      case 'IdentPat': {
        // Capitalized → tag check for tagged unions (CapitalizedIdent convention)
        if (/^[A-Z]/.test(pat.name)) return `${subj}.tag === "${pat.name}"`
        // Lowercase → binding pattern, always true (binding is handled in buildChain)
        return 'true'
      }
      // v0.4: explicit tag pattern (ident followed by braces)
      case 'TagPat':
        return `${subj}.tag === "${pat.name}"`
      // v0.9.5: Enum.Variant pattern — compares to the enum member value (a string)
      case 'EnumPat':
        return `${subj} === ${pat.enumName}.${pat.variant}`
    }
  }

  private arrowBodyWrap(expr: Expr, str: string): string {
    return expr.kind === 'ObjectLit' ? `(${str})` : str
  }

  private emitIfChain(stmt: Extract<BlockStmt, { kind: 'IfStmt' }>): void {
    const test = this.emitExpr(stmt.test)
    this.emitLine(`if (${test}) {`)
    this.indent++
    this.emitBlock(stmt.then)
    this.indent--

    let elseBlock = stmt.else_
    while (elseBlock) {
      const s = elseBlock.stmts
      if (s.length === 1 && s[0].kind === 'IfStmt') {
        const inner = s[0]
        const innerTest = this.emitExpr(inner.test)
        this.emitLine(`} else if (${innerTest}) {`)
        this.indent++
        this.emitBlock(inner.then)
        this.indent--
        elseBlock = inner.else_
      } else {
        this.emitLine(`} else {`)
        this.indent++
        this.emitBlock(elseBlock)
        this.indent--
        elseBlock = undefined
      }
    }
    this.emitLine(`}`)
  }

  private captureBlock(block: BlockExpr): string {
    const savedOut = this.out
    const savedIndent = this.indent
    this.out = []
    this.indent = savedIndent + 1
    this.emitBlock(block)
    const result = this.out.join('')
    this.out = savedOut
    this.indent = savedIndent
    return result
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  // v0.4: emit string interpolation AND multiline strings as template literals.
  // Supports {ident} and {ident.prop.sub} expressions. Falls back to plain JS
  // string if no interpolation patterns and no literal newlines found.
  private emitString(value: string, raw: string): string {
    const INTERP_RE = /\{([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\}/g
    const hasInterp = INTERP_RE.test(value)
    const hasNewlines = value.includes('\n')
    if (!hasInterp && !hasNewlines) return raw
    const template = value.replace(
      /\{([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\}/g,
      (_, expr) => `\${${expr}}`
    )
    return '`' + template.replace(/`/g, '\\`') + '`'
  }

  private emitExprParenIfNeeded(expr: Expr, parentOp: string): string {
    const s = this.emitExpr(expr)
    if (expr.kind === 'BinaryExpr' && this.precedence(expr.op) < this.precedence(parentOp)) {
      return `(${s})`
    }
    // Ternary has lower precedence than all binary operators — always wrap to preserve semantics
    if (expr.kind === 'TernaryExpr') {
      return `(${s})`
    }
    return s
  }

  private precedence(op: string): number {
    const map: Record<string, number> = {
      '??': 0,                   // v0.4 — lower than ||
      '||': 1, '&&': 2,
      '==': 3, '!=': 3, '===': 3, '!==': 3,
      '<': 4, '>': 4, '<=': 4, '>=': 4,
      '+': 5, '-': 5,
      '*': 6, '/': 6, '%': 6,
    }
    return map[op] ?? 10
  }

  private typeToJS(type: TypeExpr): string {
    if (type.name === 'int' || type.name === 'float') return 'number'
    if (type.name === 'string')     return 'string'
    if (type.name === 'bool')       return 'boolean'
    if (type.name === 'void')       return 'void'
    if (type.name === 'any')        return '*'
    if (type.name === 'object')     return 'Object'
    if (type.name === '__object__') return 'Object'
    // v0.7: fn(T, U) -> V function type expression
    if (type.name === 'fn') {
      const params = (type.fnParams ?? []).map(p => this.typeToJS(p)).join(', ')
      const ret = type.fnReturn ? this.typeToJS(type.fnReturn) : 'void'
      return `function(${params}): ${ret}`
    }
    if (type.isArray) return `${this.typeToJS({ name: type.name })}[]`
    if (type.typeArgs?.length) {
      return `${type.name}<${type.typeArgs.map(a => this.typeToJS(a)).join(', ')}>`
    }
    return type.name
  }

  private emitLine(line: string): void {
    const pad = '  '.repeat(this.indent)
    this.out.push(pad + line + '\n')
  }
}
