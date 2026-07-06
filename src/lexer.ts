// ─────────────────────────────────────────────────────────────────────────────
// Axon v0.9.5 — Lexer
// ─────────────────────────────────────────────────────────────────────────────

import { Token, TokenType } from './types.js'

const KEYWORDS: Record<string, TokenType> = {
  type:       'KW_TYPE',
  fn:         'KW_FN',
  record:     'KW_RECORD',
  module:     'KW_MODULE',
  match:      'KW_MATCH',
  let:        'KW_LET',
  where:      'KW_WHERE',
  true:       'KW_TRUE',
  false:      'KW_FALSE',
  if:         'KW_IF',
  else:       'KW_ELSE',
  return:     'KW_RETURN',
  typeof:     'KW_TYPEOF',
  instanceof: 'KW_INSTANCEOF',
  new:        'KW_NEW',
  when:       'KW_WHEN',   // v0.4: match guard
  as:         'KW_AS',     // v0.4: pipeline naming
  import:     'KW_IMPORT',   // v0.5:   import { ... } from "..."
  export:     'KW_EXPORT',   // v0.5:   export fn/type/record
  from:       'KW_FROM',     // v0.5:   from "path"
  for:        'KW_FOR',      // v0.5.2: for i in lo..hi / for x in array
  in:         'KW_IN',       // v0.5.2: for loop iteration keyword
  break:      'KW_BREAK',    // v0.5.2: break out of for/while loop
  continue:   'KW_CONTINUE', // v0.5.2: continue to next iteration
  while:      'KW_WHILE',    // v0.9.8: while condition { body }
  mut:        'KW_MUT',      // v0.5.2: let mut — mutable binding
  refine:     'KW_REFINE',     // v0.6:   refine x: "semantic claim"
  interface:  'KW_INTERFACE',  // v0.7:   interface Name { field: Type }
  infer:      'KW_INFER',      // v0.7:   let infer x = expr — model-resolved type
  async:      'KW_ASYNC',      // v0.8:   async fn — asynchronous function declaration
  await:      'KW_AWAIT',      // v0.8:   await expr — inside async functions
  enum:       'KW_ENUM',       // v0.9.5: enum Color = Red | Green | Blue
  and:        'AND',           // keyword alias for &&
  or:         'OR',            // keyword alias for ||
  not:        'BANG',          // keyword alias for !
}

export class Lexer {
  private pos = 0
  private line = 1
  private col = 1
  private tokens: Token[] = []

  constructor(private src: string) {}

  tokenize(): Token[] {
    while (this.pos < this.src.length) {
      this.skipWhitespaceAndComments()
      if (this.pos >= this.src.length) break

      const ch = this.src[this.pos]

      if (ch === '\n') {
        this.advance()
        continue
      }

      // Triple-quote string """..."""  (v0.4 — must check before single-quote strings)
      if (ch === '"' && this.src[this.pos + 1] === '"' && this.src[this.pos + 2] === '"') {
        this.readTripleQuoteString()
        continue
      }

      // Template literals
      if (ch === '`') { this.readTemplate(); continue }

      // Single/double-quote string literals
      if (ch === '"' || ch === "'") { this.readString(ch); continue }

      // Regex literals — /pattern/flags but not division
      if (ch === '/' && this.isRegexStart()) { this.readRegex(); continue }

      // Numbers
      if (this.isDigit(ch) || (ch === '.' && this.isDigit(this.src[this.pos + 1] ?? ''))) {
        this.readNumber(); continue
      }

      // Identifiers and keywords
      if (this.isIdentStart(ch)) { this.readIdent(); continue }

      // Annotations @name  AND  preset references #name
      if (ch === '@' || ch === '#') {
        const startCol = this.col
        const prefix = ch
        this.advance()
        const name = this.readIdentRaw()
        this.tokens.push({ type: 'AT', value: prefix + name, line: this.line, col: startCol })
        continue
      }

      // Spread ... and range ..= and range .. (check longest first)
      if (ch === '.' && this.src[this.pos + 1] === '.' && this.src[this.pos + 2] === '.') {
        this.emit('SPREAD', '...', 3); continue
      }
      if (ch === '.' && this.src[this.pos + 1] === '.' && this.src[this.pos + 2] === '=') {
        this.emit('DOTDOTEQ', '..=', 3); continue  // v0.5.2: inclusive range
      }
      if (ch === '.' && this.src[this.pos + 1] === '.') {
        this.emit('DOTDOT', '..', 2); continue     // v0.5.2: exclusive range
      }

      // Multi-char operators — check triple before double before single
      const three = this.src.slice(this.pos, this.pos + 3)
      if (three === '===') { this.emit('STRICT_EQ',  '===', 3); continue }
      if (three === '!==') { this.emit('STRICT_NEQ', '!==', 3); continue }
      // v0.9.6: compound assignment — check ??= before ??
      if (three === '??=') { this.emit('NULL_COALESCE_EQ', '??=', 3); continue }

      const two = this.src.slice(this.pos, this.pos + 2)
      if (two === '|>') { this.emit('PIPE_OP', '|>', 2); continue }
      if (two === '=>') { this.emit('FAT_ARROW', '=>', 2); continue }
      if (two === '->') { this.emit('THIN_ARROW', '->', 2); continue }
      if (two === '::') { this.emit('DOUBLE_COLON', '::', 2); continue }
      if (two === '==') { this.emit('EQ', '==', 2); continue }
      if (two === '!=') { this.emit('NEQ', '!=', 2); continue }
      if (two === '<=') { this.emit('LTE', '<=', 2); continue }
      if (two === '>=') { this.emit('GTE', '>=', 2); continue }
      if (two === '&&') { this.emit('AND', '&&', 2); continue }
      if (two === '||') { this.emit('OR', '||', 2); continue }
      // v0.4: nullish coalescing and optional chaining — check BEFORE single ? and .
      if (two === '??') { this.emit('NULL_COALESCE', '??', 2); continue }
      if (two === '?.') { this.emit('OPTIONAL_CHAIN', '?.', 2); continue }
      // v0.9.6: compound assignment — check before single-char + - * / %
      if (two === '+=') { this.emit('PLUS_EQ',    '+=', 2); continue }
      if (two === '-=') { this.emit('MINUS_EQ',   '-=', 2); continue }
      if (two === '*=') { this.emit('STAR_EQ',    '*=', 2); continue }
      if (two === '/=') { this.emit('SLASH_EQ',   '/=', 2); continue }
      if (two === '%=') { this.emit('PERCENT_EQ', '%=', 2); continue }

      // Single-char tokens
      const singleMap: Record<string, TokenType> = {
        '=': 'ASSIGN',   '+': 'PLUS',     '-': 'MINUS',
        '*': 'STAR',     '/': 'SLASH',    '%': 'PERCENT',
        '<': 'LT',       '>': 'GT',       '!': 'BANG',
        '|': 'PIPE',     '.': 'DOT',      '?': 'QUESTION',
        '(': 'LPAREN',   ')': 'RPAREN',
        '[': 'LBRACKET', ']': 'RBRACKET',
        '{': 'LBRACE',   '}': 'RBRACE',
        ',': 'COMMA',    ':': 'COLON',    ';': 'SEMICOLON',
        '_': 'UNDERSCORE',
      }
      if (ch in singleMap) {
        this.emit(singleMap[ch], ch, 1); continue
      }

      // Unknown — skip
      this.advance()
    }

    this.tokens.push({ type: 'EOF', value: '', line: this.line, col: this.col })
    return this.tokens
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos]

      if (ch === ' ' || ch === '\r' || ch === '\t') {
        this.advance(); continue
      }

      if (ch === '/' && this.src[this.pos + 1] === '/') {
        while (this.pos < this.src.length && this.src[this.pos] !== '\n') {
          this.advance()
        }
        continue
      }

      break
    }
  }

  // v0.4: Triple-quote multiline string """..."""
  // Preserves literal newlines in the token value.
  private readTripleQuoteString(): void {
    const startLine = this.line
    const startCol = this.col
    this.advance(); this.advance(); this.advance() // consume opening """
    let value = ''
    while (this.pos < this.src.length) {
      if (this.src[this.pos] === '"' &&
          this.src[this.pos + 1] === '"' &&
          this.src[this.pos + 2] === '"') {
        this.advance(); this.advance(); this.advance() // consume closing """
        break
      }
      const ch = this.src[this.pos]
      if (ch === '\n') { this.line++; this.col = 1; this.pos++; value += '\n' }
      else { value += ch; this.advance() }
    }
    // Strip a single leading newline if the string opens with one (idiomatic triple-quote style)
    if (value.startsWith('\n')) value = value.slice(1)
    this.tokens.push({ type: 'STRING', value, line: startLine, col: startCol })
  }

  private readString(quote: string): void {
    const startCol = this.col
    this.advance() // opening quote
    let value = ''
    while (this.pos < this.src.length && this.src[this.pos] !== quote) {
      if (this.src[this.pos] === '\\') {
        this.advance()
        const esc = this.src[this.pos] ?? ''
        const escMap: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"' }
        value += escMap[esc] ?? ('\\' + esc)
        this.advance()
      } else {
        value += this.src[this.pos]
        this.advance()
      }
    }
    this.advance() // closing quote
    this.tokens.push({ type: 'STRING', value, line: this.line, col: startCol })
  }

  private readTemplate(): void {
    const startCol = this.col
    let raw = '`'
    this.advance()
    while (this.pos < this.src.length && this.src[this.pos] !== '`') {
      raw += this.src[this.pos]
      if (this.src[this.pos] === '\n') { this.line++; this.col = 1 } else { this.col++ }
      this.pos++
    }
    raw += '`'
    this.advance()
    this.tokens.push({ type: 'TEMPLATE', value: raw, line: this.line, col: startCol })
  }

  private readRegex(): void {
    const startCol = this.col
    this.advance() // opening /
    let pattern = ''
    let inClass = false
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos]
      if (ch === '[') inClass = true
      if (ch === ']') inClass = false
      if (ch === '/' && !inClass) break
      if (ch === '\\') { pattern += ch; this.advance() }
      pattern += this.src[this.pos] ?? ''
      this.advance()
    }
    this.advance() // closing /
    let flags = ''
    while (this.pos < this.src.length && /[gimsuy]/.test(this.src[this.pos])) {
      flags += this.src[this.pos]
      this.advance()
    }
    this.tokens.push({ type: 'REGEX', value: `/${pattern}/${flags}`, line: this.line, col: startCol })
  }

  private readNumber(): void {
    const startCol = this.col
    let raw = ''

    // v0.9.5: hex (0x...) and binary (0b...) literals
    if (this.src[this.pos] === '0') {
      const next = this.src[this.pos + 1]
      if (next === 'x' || next === 'X') {
        raw += this.src[this.pos]; this.advance()
        raw += this.src[this.pos]; this.advance()
        while (this.pos < this.src.length) {
          const ch = this.src[this.pos]
          if (/[0-9a-fA-F_]/.test(ch)) { raw += ch; this.advance() }
          else break
        }
        this.tokens.push({ type: 'NUMBER', value: raw.replace(/_/g, ''), line: this.line, col: startCol })
        return
      }
      if (next === 'b' || next === 'B') {
        raw += this.src[this.pos]; this.advance()
        raw += this.src[this.pos]; this.advance()
        while (this.pos < this.src.length) {
          const ch = this.src[this.pos]
          if (/[01_]/.test(ch)) { raw += ch; this.advance() }
          else break
        }
        this.tokens.push({ type: 'NUMBER', value: raw.replace(/_/g, ''), line: this.line, col: startCol })
        return
      }
    }

    // Decimal with optional _ separators
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos]
      if (this.isDigit(ch) || ch === '_') {
        raw += ch; this.advance()
      } else if (ch === '.' && this.isDigit(this.src[this.pos + 1] ?? '')) {
        raw += ch; this.advance()
      } else {
        break
      }
    }
    this.tokens.push({ type: 'NUMBER', value: raw.replace(/_/g, ''), line: this.line, col: startCol })
  }

  private readIdent(): void {
    const startCol = this.col
    const startLine = this.line
    const name = this.readIdentRaw()
    const kwType = Object.prototype.hasOwnProperty.call(KEYWORDS, name) ? KEYWORDS[name] : undefined
    if (kwType) {
      this.tokens.push({ type: kwType, value: name, line: startLine, col: startCol })
    } else {
      this.tokens.push({ type: 'IDENT', value: name, line: startLine, col: startCol })
    }
  }

  private readIdentRaw(): string {
    let name = ''
    while (this.pos < this.src.length && this.isIdentContinue(this.src[this.pos])) {
      name += this.src[this.pos]
      this.advance()
    }
    return name
  }

  private isRegexStart(): boolean {
    const last = this.tokens[this.tokens.length - 1]
    if (!last) return true
    const t = last.type
    return !(t === 'IDENT' || t === 'NUMBER' || t === 'RPAREN' || t === 'RBRACKET')
  }

  private isDigit(ch: string): boolean { return ch >= '0' && ch <= '9' }
  private isIdentStart(ch: string): boolean { return /[a-zA-Z_$]/.test(ch) }
  private isIdentContinue(ch: string): boolean { return /[a-zA-Z0-9_$]/.test(ch) }

  private emit(type: TokenType, value: string, len: number): void {
    this.tokens.push({ type, value, line: this.line, col: this.col })
    for (let i = 0; i < len; i++) this.advance()
  }

  private advance(): void {
    if (this.src[this.pos] === '\n') { this.line++; this.col = 1 }
    else { this.col++ }
    this.pos++
  }
}
