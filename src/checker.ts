// ─────────────────────────────────────────────────────────────────────────────
// Axon v0.5.0 — Static checker
// Runs after parsing, before codegen. Produces warnings for:
//   • @pure functions that call known side-effectful globals
//   • @exhaustive matches missing wildcard/boolean/union coverage
//   • @test bodies that are trivially false literals
// ─────────────────────────────────────────────────────────────────────────────

import {
  Program, TopLevelDecl, FnDecl, TaggedUnionDecl, TestDecl, Annotation,
  Expr, BlockExpr, BlockStmt, MatchExpr, MatchPattern,
  Diagnostic, PipeAsStep,
} from './types.js'

const EFFECTFUL_GLOBALS = new Set([
  'document', 'window', 'console', 'fetch', 'XMLHttpRequest',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'localStorage', 'sessionStorage', 'indexedDB',
  'alert', 'confirm', 'prompt',
])

const EFFECTFUL_METHODS = new Set([
  'log', 'warn', 'error', 'info',
  'getElementById', 'querySelector', 'querySelectorAll',
  'createElement', 'appendChild', 'removeChild', 'insertBefore',
  'addEventListener', 'removeEventListener',
  'setAttribute', 'removeAttribute',
  'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse',
  'write', 'writeln',
])

const IMPURE_MATH = new Set(['random'])

export class Checker {
  private diagnostics: Diagnostic[] = []
  // v0.4: known tagged union variant names, keyed by union name
  private unionVariants: Map<string, Set<string>> = new Map()

  check(program: Program): Diagnostic[] {
    this.diagnostics = []
    this.unionVariants.clear()

    // Pre-pass: collect tagged union declarations for exhaustiveness checking
    for (const decl of program.body) {
      if (decl.kind === 'TaggedUnionDecl') {
        this.unionVariants.set(decl.name, new Set(decl.variants.map(v => v.name)))
      }
      // v0.5: exported tagged unions should also be registered
      if (decl.kind === 'ExportDecl' && decl.decl.kind === 'TaggedUnionDecl') {
        this.unionVariants.set(decl.decl.name, new Set(decl.decl.variants.map(v => v.name)))
      }
    }

    for (const decl of program.body) {
      this.checkTopLevel(decl)
    }
    return this.diagnostics
  }

  private checkTopLevel(decl: TopLevelDecl): void {
    if (decl.kind === 'FnDecl')          this.checkFn(decl)
    if (decl.kind === 'ModuleDecl')       decl.body.forEach(d => this.checkTopLevel(d))
    // v0.4: warn if a @test body is a trivially false literal
    if (decl.kind === 'TestDecl')         this.checkTest(decl)
    // v0.5: walk into exported declarations
    if (decl.kind === 'ExportDecl')       this.checkTopLevel(decl.decl)
    // v0.5: import declarations are validated by the CLI bundler, no checks here
  }

  private checkFn(fn: FnDecl): void {
    const isPure       = fn.annotations.some(a => a.name === 'pure')
    const isExhaustive = fn.annotations.some(a => a.name === 'exhaustive')
    const isThrows     = fn.annotations.some(a => a.name === 'throws')

    if (isPure)       this.checkPurity(fn.body, fn.name, fn.line)
    if (isExhaustive) this.checkExhaustive(fn.body, fn.name, fn.line)
    if (isThrows)     this.checkThrows(fn.body, fn.name, fn.line)
  }

  // v0.6: @throws — warn if the function never calls ok() or err()
  private checkThrows(expr: Expr, fnName: string, fnLine: number): void {
    let hasOk = false, hasErr = false
    this.walkExpr(expr, (e) => {
      if (e.kind === 'CallExpr' && e.callee.kind === 'Identifier') {
        if (e.callee.name === 'ok')  hasOk  = true
        if (e.callee.name === 'err') hasErr = true
      }
    })
    if (!hasOk && !hasErr) {
      this.warn(`@throws function '${fnName}' never calls ok() or err()`, fnLine)
    }
  }

  private checkTest(decl: TestDecl): void {
    if (decl.body.kind === 'BoolLit' && decl.body.value === false) {
      this.warn(`@test "${decl.description}" has a trivially false assertion`, decl.line)
    }
  }

  // ── Purity checker ────────────────────────────────────────────────────────────

  private checkPurity(expr: Expr, fnName: string, fnLine: number): void {
    this.walkExpr(expr, (e) => {
      if (e.kind === 'Identifier' && EFFECTFUL_GLOBALS.has(e.name)) {
        this.warn(`@pure function '${fnName}' references effectful global '${e.name}'`, fnLine)
      }
      if (e.kind === 'MemberExpr') {
        if (e.object.kind === 'Identifier' && EFFECTFUL_GLOBALS.has(e.object.name)) {
          this.warn(`@pure function '${fnName}' accesses effectful global '${e.object.name}.${e.property}'`, fnLine)
        }
        if (e.object.kind === 'Identifier' && e.object.name === 'Math' && IMPURE_MATH.has(e.property)) {
          this.warn(`@pure function '${fnName}' calls Math.${e.property} which is non-deterministic`, fnLine)
        }
        if (EFFECTFUL_METHODS.has(e.property)) {
          this.warn(`@pure function '${fnName}' calls potentially effectful method '.${e.property}()'`, fnLine)
        }
      }
    })
  }

  // ── Exhaustiveness checker ────────────────────────────────────────────────────

  private checkExhaustive(expr: Expr, fnName: string, fnLine: number): void {
    this.walkExpr(expr, (e) => {
      if (e.kind !== 'MatchExpr') return
      const arms = e.arms

      // Wildcard always makes a match exhaustive
      const hasWildcard = arms.some(a =>
        a.pattern.kind === 'WildcardPat' ||
        (a.pattern.kind === 'IdentPat' && !/^[A-Z]/.test(a.pattern.name))
      )
      if (hasWildcard) return

      // Boolean exhaustiveness: both true and false
      const subjectIsBool = this.looksLikeBool(e.subject)
      if (subjectIsBool) {
        const hasTrue  = arms.some(a => a.pattern.kind === 'LiteralPat' && a.pattern.value === true)
        const hasFalse = arms.some(a => a.pattern.kind === 'LiteralPat' && a.pattern.value === false)
        if (!hasTrue || !hasFalse) {
          const missing = !hasTrue ? 'true' : 'false'
          this.warn(`@exhaustive function '${fnName}': match on boolean missing case for '${missing}'`, fnLine)
        }
        return
      }

      // v0.4: tagged union exhaustiveness — check all variants are covered
      const tagPatterns = arms
        .map(a => a.pattern)
        .filter(p => p.kind === 'TagPat' || (p.kind === 'IdentPat' && /^[A-Z]/.test(p.name)))
      if (tagPatterns.length > 0) {
        const coveredTags = new Set(tagPatterns.map(p => (p as any).name as string))
        for (const [, variants] of this.unionVariants) {
          if ([...variants].some(v => coveredTags.has(v))) {
            // This union is being matched — check all variants are covered
            for (const variant of variants) {
              if (!coveredTags.has(variant)) {
                this.warn(
                  `@exhaustive function '${fnName}': match on union missing case for '${variant}'`,
                  fnLine
                )
              }
            }
          }
        }
        return
      }

      const hasCompare = arms.some(a => a.pattern.kind === 'ComparePat')
      if (!hasCompare) {
        this.warn(
          `@exhaustive function '${fnName}': match has no wildcard '_' — may not cover all cases`,
          fnLine
        )
      }
    })
  }

  private looksLikeBool(expr: Expr): boolean {
    if (expr.kind === 'BoolLit') return true
    if (expr.kind === 'Identifier') {
      const name = expr.name.toLowerCase()
      return name === 'state' || name.includes('bool') || name.includes('flag') ||
             name.includes('is') || name.includes('has') || name.includes('can') ||
             name.includes('dark') || name.includes('open') || name.includes('valid') ||
             name.includes('active') || name.includes('enabled')
    }
    return false
  }

  // ── AST walker ────────────────────────────────────────────────────────────────

  private walkExpr(expr: Expr, visit: (e: Expr) => void): void {
    visit(expr)
    switch (expr.kind) {
      case 'BinaryExpr':   this.walkExpr(expr.left, visit); this.walkExpr(expr.right, visit); break
      case 'UnaryExpr':    this.walkExpr(expr.operand, visit); break
      case 'TernaryExpr':  this.walkExpr(expr.test, visit); this.walkExpr(expr.consequent, visit); this.walkExpr(expr.alternate, visit); break
      case 'CallExpr':     this.walkExpr(expr.callee, visit); expr.args.forEach(a => this.walkExpr(a, visit)); break
      case 'NewExpr':      this.walkExpr(expr.callee, visit); expr.args.forEach(a => this.walkExpr(a, visit)); break
      case 'MemberExpr':   this.walkExpr(expr.object, visit); break
      case 'IndexExpr':    this.walkExpr(expr.object, visit); this.walkExpr(expr.index, visit); break
      case 'SpreadExpr':   this.walkExpr(expr.argument, visit); break
      case 'ObjectLit':    expr.properties.forEach(p => this.walkExpr(p.value, visit)); break
      case 'ArrayLit':     expr.elements.forEach(e => this.walkExpr(e, visit)); break
      case 'LambdaExpr':   this.walkExpr(expr.body, visit); break
      case 'PipelineExpr':
        // v0.4: skip PipeAs steps (they're not Expr nodes)
        expr.steps.forEach(s => {
          if ((s as any).kind !== 'PipeAs') this.walkExpr(s as Expr, visit)
        })
        break
      case 'MatchExpr':
        this.walkExpr(expr.subject, visit)
        expr.arms.forEach(a => {
          // v0.4: walk when guards too
          if (a.guard) this.walkExpr(a.guard, visit)
          this.walkExpr(a.body, visit)
        })
        break
      case 'BlockExpr':             this.walkBlock(expr, visit); break
      case 'ResultPropagateExpr':   this.walkExpr(expr.value, visit); break  // v0.6
      default: break
    }
  }

  private walkBlock(block: BlockExpr, visit: (e: Expr) => void): void {
    for (const stmt of block.stmts) {
      switch (stmt.kind) {
        case 'LetStmt':          if (stmt.value) this.walkExpr(stmt.value, visit); break
        case 'DestructureStmt':  this.walkExpr(stmt.value, visit); break   // v0.4
        case 'ReturnStmt':       this.walkExpr(stmt.value, visit); break
        case 'ExprStmt':         this.walkExpr(stmt.value, visit); break
        case 'IfStmt':
          this.walkExpr(stmt.test, visit)
          this.walkBlock(stmt.then, visit)
          if (stmt.else_) this.walkBlock(stmt.else_, visit)
          break
        // v0.5.2: for loops
        case 'ForRangeStmt':
          this.walkExpr(stmt.lo, visit)
          this.walkExpr(stmt.hi, visit)
          this.walkBlock(stmt.body, visit)
          break
        case 'ForInStmt':
          this.walkExpr(stmt.iter, visit)
          this.walkBlock(stmt.body, visit)
          break
        case 'BreakStmt':
        case 'ContinueStmt':
          break
        case 'RefineStmt':
          break  // v0.6: semantic claim — no walk needed, no side effects
      }
    }
  }

  private warn(message: string, line: number): void {
    this.diagnostics.push({ severity: 'warning', message, line })
  }

  private error(message: string, line: number): void {
    this.diagnostics.push({ severity: 'error', message, line })
  }
}
