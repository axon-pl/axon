// ─────────────────────────────────────────────────────────────────────────────
// Axon v0.9.5 — Token and AST type definitions
// ─────────────────────────────────────────────────────────────────────────────

export type TokenType =
  // Keywords
  | 'KW_TYPE' | 'KW_FN' | 'KW_RECORD' | 'KW_MODULE'
  | 'KW_MATCH' | 'KW_LET' | 'KW_WHERE'
  | 'KW_TRUE' | 'KW_FALSE'
  | 'KW_IF' | 'KW_ELSE' | 'KW_RETURN'
  | 'KW_TYPEOF' | 'KW_INSTANCEOF' | 'KW_NEW'
  | 'KW_WHEN'           // v0.4: match guard  — | pat when expr => body
  | 'KW_AS'             // v0.4: pipeline bind — |> as name
  | 'KW_IMPORT'         // v0.5:   import { ... } from "..."
  | 'KW_EXPORT'         // v0.5:   export fn / export type / export record
  | 'KW_FROM'           // v0.5:   from "path"
  | 'KW_FOR'            // v0.5.2: for loop
  | 'KW_IN'             // v0.5.2: for...in keyword
  | 'KW_BREAK'          // v0.5.2: break statement
  | 'KW_CONTINUE'       // v0.5.2: continue statement
  | 'KW_MUT'            // v0.5.2: mutable binding
  | 'KW_REFINE'         // v0.6:   refine x: "semantic claim"
  | 'KW_INTERFACE'      // v0.7:   interface Name { field: Type }
  | 'KW_INFER'          // v0.7:   let infer x = expr — model-resolved type
  | 'KW_ASYNC'          // v0.8:   async fn / async lambda
  | 'KW_AWAIT'          // v0.8:   await expr inside async functions
  | 'KW_ENUM'           // v0.9.5: enum Color = Red | Green | Blue
  // Literals
  | 'NUMBER' | 'STRING' | 'REGEX' | 'TEMPLATE'
  // Identifier
  | 'IDENT'
  // Multi-char operators
  | 'PIPE_OP'           // |>
  | 'FAT_ARROW'         // =>
  | 'THIN_ARROW'        // ->
  | 'DOUBLE_COLON'      // ::
  | 'EQ'                // ==
  | 'STRICT_EQ'         // ===
  | 'NEQ'               // !=
  | 'STRICT_NEQ'        // !==
  | 'LTE'               // <=
  | 'GTE'               // >=
  | 'AND'               // &&
  | 'OR'                // ||
  | 'SPREAD'            // ...
  | 'DOTDOT'            // ..   v0.5.2: exclusive range
  | 'DOTDOTEQ'          // ..=  v0.5.2: inclusive range
  | 'OPTIONAL_CHAIN'    // ?.  v0.4 — optional member/index/call
  | 'NULL_COALESCE'     // ??  v0.4 — nullish coalescing
  // Compound assignment operators — v0.9.6
  | 'PLUS_EQ'           // +=
  | 'MINUS_EQ'          // -=
  | 'STAR_EQ'           // *=
  | 'SLASH_EQ'          // /=
  | 'PERCENT_EQ'        // %=
  | 'NULL_COALESCE_EQ'  // ??=
  // Single-char operators
  | 'ASSIGN'            // =
  | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'PERCENT'
  | 'LT' | 'GT'
  | 'BANG'              // !
  | 'PIPE'              // |
  | 'DOT'
  | 'QUESTION'          // ? (ternary only — ?. and ?? are their own tokens)
  // Punctuation
  | 'LPAREN' | 'RPAREN'
  | 'LBRACKET' | 'RBRACKET'
  | 'LBRACE' | 'RBRACE'
  | 'COMMA' | 'COLON' | 'SEMICOLON'
  | 'UNDERSCORE' | 'AT'
  // Meta
  | 'NEWLINE' | 'EOF'

export interface Token {
  type: TokenType
  value: string
  line: number
  col: number
}

// ─────────────────────────────────────────────────────────────────────────────
// AST — Top-level declarations
// ─────────────────────────────────────────────────────────────────────────────

export interface Program {
  kind: 'Program'
  body: TopLevelDecl[]
}

export type TopLevelDecl =
  | TypeAlias
  | TaggedUnionDecl   // v0.4
  | RecordDecl
  | FnDecl
  | ModuleDecl
  | TestDecl          // v0.4
  | ImportDecl        // v0.5
  | ExportDecl        // v0.5
  | TopLevelExpr      // v0.5: bare expression statement at top level (e.g. mount())
  | TopLevelLet       // v0.5: top-level let binding (e.g. let state = {...})
  | InterfaceDecl     // v0.7: interface Name { field: Type; method: fn(T) -> U }
  | StoreDecl         // v0.8: store Name { field: Type = default }
  | EnumDecl          // v0.9.5: enum Color = Red | Green | Blue
  | TopLevelStmt      // v0.5.2: top-level statement (for loop, etc.)

export interface TypeAlias {
  kind: 'TypeAlias'
  name: string
  typeParams?: string[]   // v0.7: generic type params e.g. type Pair<A, B>
  type: TypeExpr
  constraint?: Constraint
  line: number
}

// v0.7: interface Name { field: Type; method: fn(T) -> U }
export interface InterfaceDecl {
  kind: 'InterfaceDecl'
  name: string
  typeParams?: string[]
  fields: InterfaceField[]
  line: number
}

export interface InterfaceField {
  name: string
  type: TypeExpr
}

// v0.9.5: enum — enum Color = Red | Green | Blue
export interface EnumDecl {
  kind: 'EnumDecl'
  name: string
  variants: string[]
  line: number
}

// v0.4: Tagged union — type Shape = | Circle { r: float } | Rect { w: float, h: float } | Point
export interface TaggedUnionDecl {
  kind: 'TaggedUnionDecl'
  name: string
  variants: UnionVariant[]
  line: number
}

export interface UnionVariant {
  name: string
  fields: FieldDecl[]   // empty for unit variants
}

// v0.4: Top-level test — @test "description" { assertion_expr }
export interface TestDecl {
  kind: 'TestDecl'
  description: string
  body: Expr
  line: number
}

// v0.5: import { name, name } from "./path"
export interface ImportDecl {
  kind: 'ImportDecl'
  names: string[]       // imported names (empty = import all side-effects)
  source: string        // module path string
  line: number
}

// v0.5: export fn / export type / export record
export interface ExportDecl {
  kind: 'ExportDecl'
  decl: FnDecl | TypeAlias | TaggedUnionDecl | RecordDecl
  line: number
}

export interface TopLevelExpr {
  kind: 'TopLevelExpr'
  expr: Expr
  line: number
}

export interface TopLevelLet {
  kind: 'TopLevelLet'
  name: string | null
  value: Expr
  line: number
}

export interface TopLevelStmt {
  kind: 'TopLevelStmt'
  stmt: BlockStmt
  line: number
}

// ── Constraint expressions (for `where` clauses) ──────────────────────────────
export type Constraint =
  | CompareConstraint
  | LengthConstraint
  | MatchesConstraint
  | RegexConstraint
  | AndConstraint
  | OrConstraint
  | NotConstraint
  | CustomConstraint

export interface CompareConstraint  { kind: 'CompareConstraint'; op: string; value: number | string }
export interface LengthConstraint   { kind: 'LengthConstraint'; op: string; value: number }
export interface MatchesConstraint  { kind: 'MatchesConstraint'; preset: string }
export interface RegexConstraint    { kind: 'RegexConstraint'; pattern: string; flags: string }
export interface AndConstraint      { kind: 'AndConstraint'; left: Constraint; right: Constraint }
export interface OrConstraint       { kind: 'OrConstraint'; left: Constraint; right: Constraint }
export interface NotConstraint      { kind: 'NotConstraint'; inner: Constraint }
export interface CustomConstraint   { kind: 'CustomConstraint'; expr: Expr }

export interface RecordDecl {
  kind: 'RecordDecl'
  name: string
  typeParams?: string[]   // v0.7: generic type params e.g. record Pair<A, B>
  fields: FieldDecl[]
  line: number
}

export interface FieldDecl {
  name: string
  type: TypeExpr
}

export interface FnDecl {
  kind: 'FnDecl'
  name: string
  typeParams?: string[]   // v0.7: generic type params e.g. fn map<T, U>
  params: FnParam[]
  returnType: TypeExpr
  annotations: Annotation[]
  body: Expr
  shortForm?: boolean
  isAsync?: boolean        // v0.8: async fn — emits async arrow function
  line: number
}

// v0.8: store Name { field: Type = default }
// Reactive mutable state as an explicit effects boundary.
export interface StoreDecl {
  kind: 'StoreDecl'
  name: string
  fields: StoreField[]
  line: number
}

export interface StoreField {
  name: string
  type: TypeExpr
  default: Expr
}

// ── Checker diagnostics ────────────────────────────────────────────────────────
export type DiagnosticSeverity = 'warning' | 'error'

export interface Diagnostic {
  severity: DiagnosticSeverity
  message: string
  line: number
  col?: number
}

export interface ModuleDecl {
  kind: 'ModuleDecl'
  name: string
  annotations: Annotation[]
  body: TopLevelDecl[]
  line: number
}

export interface Annotation {
  name: string
  value: string | string[] | null
}

export interface FnParam {
  name: string
  type: TypeExpr
  spread?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// AST — Type expressions
// ─────────────────────────────────────────────────────────────────────────────

export interface TypeExpr {
  name: string
  typeArgs?: TypeExpr[]   // e.g. List<T> → typeArgs: [T]
  isArray?: boolean
  isOptional?: boolean
  union?: TypeExpr[]
  fnParams?: TypeExpr[]   // v0.7: fn(T, U) -> V — parameter types
  fnReturn?: TypeExpr     // v0.7: fn(T) -> V — return type
}

// ─────────────────────────────────────────────────────────────────────────────
// AST — Expressions
// ─────────────────────────────────────────────────────────────────────────────

export type Expr =
  | NumberLit
  | StringLit
  | TemplateLit
  | BoolLit
  | RegexLit
  | NullLit
  | Identifier
  | ObjectLit
  | ArrayLit
  | SpreadExpr
  | BinaryExpr
  | UnaryExpr
  | TernaryExpr
  | CallExpr
  | NewExpr
  | IndexExpr
  | MemberExpr
  | LambdaExpr
  | PipelineExpr
  | BlockExpr
  | MatchExpr
  | RawJS
  | ResultPropagateExpr  // v0.6: expr? — propagate Err, unwrap Ok
  | AwaitExpr            // v0.8: await expr — inside async functions

export interface NumberLit  { kind: 'NumberLit';  value: number; raw?: string }
export interface StringLit  { kind: 'StringLit';  value: string; raw: string }
export interface TemplateLit { kind: 'TemplateLit'; raw: string }
export interface BoolLit    { kind: 'BoolLit';   value: boolean }
export interface RegexLit   { kind: 'RegexLit';  pattern: string; flags: string }
export interface NullLit    { kind: 'NullLit' }
export interface RawJS      { kind: 'RawJS'; code: string }

export interface Identifier { kind: 'Identifier'; name: string }

export interface ObjectLit {
  kind: 'ObjectLit'
  properties: ObjectProperty[]
}
export interface ObjectProperty {
  kind: 'ObjectProperty'
  key: string | Expr
  value: Expr
  computed?: boolean
  shorthand?: boolean
  spread?: boolean
}

export interface ArrayLit {
  kind: 'ArrayLit'
  elements: Expr[]
}

export interface SpreadExpr {
  kind: 'SpreadExpr'
  argument: Expr
}

export interface BinaryExpr {
  kind: 'BinaryExpr'
  op: string
  left: Expr
  right: Expr
}

export interface UnaryExpr {
  kind: 'UnaryExpr'
  op: string
  operand: Expr
  prefix: boolean
}

export interface TernaryExpr {
  kind: 'TernaryExpr'
  test: Expr
  consequent: Expr
  alternate: Expr
}

export interface CallExpr {
  kind: 'CallExpr'
  callee: Expr
  args: Expr[]
  optional?: boolean   // v0.4: ?.() optional call
}

export interface NewExpr {
  kind: 'NewExpr'
  callee: Expr
  args: Expr[]
}

export interface IndexExpr {
  kind: 'IndexExpr'
  object: Expr
  index: Expr
  optional?: boolean   // v0.4: ?.[index] optional index
}

export interface MemberExpr {
  kind: 'MemberExpr'
  object: Expr
  property: string
  optional?: boolean   // v0.4: ?.prop optional member
}

export interface LambdaExpr {
  kind: 'LambdaExpr'
  params: LambdaParam[]
  body: Expr
  isAsync?: boolean
}

export type LambdaParam = string | { name: string; defaultValue?: Expr; destructure?: boolean }

// v0.4: pipeline |> as name step (not an Expr — special pipeline step)
export interface PipeAsStep {
  kind: 'PipeAs'
  name: string
}

export interface PipelineExpr {
  kind: 'PipelineExpr'
  steps: (Expr | PipeAsStep)[]
}

export interface BlockExpr {
  kind: 'BlockExpr'
  stmts: BlockStmt[]
}

export type BlockStmt =
  | { kind: 'LetStmt'; name: string | null; value: Expr; mutable?: boolean; infer?: boolean }
  | { kind: 'DestructureStmt'; style: 'object' | 'array'; names: string[]; value: Expr }  // v0.4
  | { kind: 'ReturnStmt'; value: Expr }
  | { kind: 'ExprStmt'; value: Expr }
  | { kind: 'IfStmt'; test: Expr; then: BlockExpr; else_?: BlockExpr }
  | { kind: 'ForRangeStmt'; varName: string; lo: Expr; hi: Expr; inclusive: boolean; body: BlockExpr }  // v0.5.2
  | { kind: 'ForInStmt';    varName: string; iter: Expr; body: BlockExpr }                              // v0.5.2
  | { kind: 'BreakStmt' }    // v0.5.2
  | { kind: 'ContinueStmt' } // v0.5.2
  | { kind: 'RefineStmt'; name: string; claim: string }  // v0.6: refine x: "claim"

// v0.6: expr? — if Err, propagate immediately; if Ok, unwrap the value
export interface ResultPropagateExpr {
  kind: 'ResultPropagateExpr'
  value: Expr
}

// v0.8: await expr — resolves a Promise inside an async function
export interface AwaitExpr {
  kind: 'AwaitExpr'
  value: Expr
}

export interface MatchExpr {
  kind: 'MatchExpr'
  subject: Expr
  arms: MatchArm[]
}

export interface MatchArm {
  pattern: MatchPattern
  guard?: Expr   // v0.4: | pat when guard => body
  body: Expr
}

export type MatchPattern =
  | { kind: 'LiteralPat'; value: string | number | boolean }
  | { kind: 'WildcardPat' }
  | { kind: 'ComparePat'; op: string; value: number | string }
  | { kind: 'IdentPat'; name: string }
  | { kind: 'TagPat'; name: string; bindings: string[] }   // v0.4: tagged union pattern
  | { kind: 'EnumPat'; enumName: string; variant: string } // v0.9.5: enum member pattern Color.Red
