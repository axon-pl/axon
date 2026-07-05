// ─────────────────────────────────────────────────────────────────────────────
// Axon v0.9.0 — Canonical formatter
// Normalizes Axon source: indentation, operator spacing, trailing whitespace.
// Strategy: token-stream reconstruction with line-break preservation.
// ─────────────────────────────────────────────────────────────────────────────

import { Lexer } from './lexer.js'
import { Token, TokenType } from './types.js'

// ── Spacing rules between adjacent tokens ────────────────────────────────────

// No space before these token types
const NO_SPACE_BEFORE = new Set<TokenType>([
  'RPAREN', 'RBRACKET', 'RBRACE',
  'COMMA', 'SEMICOLON',
  'DOT', 'OPTIONAL_CHAIN',
  'PIPE',   // union type separator |
])

// No space after these token types
const NO_SPACE_AFTER = new Set<TokenType>([
  'LPAREN', 'LBRACKET',
  'DOT', 'OPTIONAL_CHAIN',
  'AT',
  'BANG',   // unary !
  'MINUS',  // handled specially for unary -
])

// Always space before these
const SPACE_BEFORE = new Set<TokenType>([
  'LBRACE',
  'THIN_ARROW', 'FAT_ARROW', 'DOUBLE_COLON',
  'PIPE_OP',
  'AND', 'OR',
  'EQ', 'STRICT_EQ', 'NEQ', 'STRICT_NEQ',
  'LTE', 'GTE',
  'ASSIGN',
  'NULL_COALESCE',
  'KW_ELSE',
])

// Always space after these
const SPACE_AFTER = new Set<TokenType>([
  'COMMA',
  'COLON',
  'THIN_ARROW', 'FAT_ARROW', 'DOUBLE_COLON',
  'PIPE_OP',
  'AND', 'OR',
  'EQ', 'STRICT_EQ', 'NEQ', 'STRICT_NEQ',
  'LTE', 'GTE',
  'ASSIGN',
  'NULL_COALESCE',
  'KW_FN', 'KW_TYPE', 'KW_RECORD', 'KW_LET',
  'KW_MATCH', 'KW_IF', 'KW_ELSE', 'KW_RETURN',
  'KW_FOR', 'KW_IN', 'KW_ASYNC', 'KW_AWAIT',
  'KW_IMPORT', 'KW_EXPORT', 'KW_FROM',
  'KW_INTERFACE', 'KW_REFINE', 'KW_INFER', 'KW_MUT',
  'KW_WHEN', 'KW_AS', 'KW_NEW',
  'KW_WHERE',
])

function needsSpace(prev: Token, cur: Token): boolean {
  const pt = prev.type as string
  const ct = cur.type as string
  if (NO_SPACE_BEFORE.has(cur.type))  return false
  if (NO_SPACE_AFTER.has(prev.type))  return false
  if (SPACE_BEFORE.has(cur.type))     return true
  if (SPACE_AFTER.has(prev.type))     return true
  // Binary arithmetic operators: space both sides
  if (pt === 'PLUS'    || ct === 'PLUS')    return true
  if (pt === 'STAR'    || ct === 'STAR')    return true
  if (pt === 'SLASH'   || ct === 'SLASH')   return true
  if (pt === 'PERCENT' || ct === 'PERCENT') return true
  // LT / GT: no spaces — preserves generic type params like List<T>
  if (pt === 'LT' || ct === 'LT') return false
  if (pt === 'GT' || ct === 'GT') return false
  // MINUS: unary when after op/open/keyword (no space); binary otherwise
  if (ct === 'MINUS') {
    const afterOp = (
      pt === 'ASSIGN' || pt === 'PLUS'  || pt === 'MINUS' ||
      pt === 'STAR'   || pt === 'SLASH' || pt === 'PERCENT' ||
      pt === 'COMMA'  || pt === 'LPAREN' || pt === 'LBRACKET' ||
      pt === 'PIPE_OP' || pt === 'FAT_ARROW' || pt === 'THIN_ARROW' ||
      pt === 'COLON'
    )
    return !afterOp
  }
  if (pt === 'MINUS') {
    return !(ct === 'IDENT' || ct === 'NUMBER' || ct === 'LPAREN')
  }
  // No space between ident and ( (function call)
  if (ct === 'LPAREN') return false
  if (ct === 'LBRACKET' && pt === 'IDENT') return false
  // RBRACE: space before unless empty block {}
  if (ct === 'RBRACE') return pt !== 'LBRACE'
  // LBRACE: space after unless empty block {}
  if (pt === 'LBRACE') return ct !== 'RBRACE'
  // PIPE |: space both sides (union type | A | B)
  if (ct === 'PIPE' || pt === 'PIPE') return true
  // Default: always space
  return true
}

// ── Main format function ──────────────────────────────────────────────────────

export interface FormatResult {
  formatted: string
  changed: boolean
}

export function format(source: string): FormatResult {
  // Normalise line endings
  const normalised = source.replace(/\r\n/g, '\n')

  // Tokenize — the lexer skips whitespace but preserves line/col
  let tokens: Token[]
  try {
    tokens = new Lexer(normalised).tokenize()
  } catch {
    // If source has parse errors, return it unmodified (don't corrupt bad source)
    return { formatted: normalised, changed: false }
  }
  // Drop EOF
  tokens = tokens.filter(t => t.type !== 'EOF')
  if (tokens.length === 0) return { formatted: '', changed: false }

  // Walk tokens, reconstructing source line by line
  // We respect original line breaks (from token line numbers) but normalise spacing within a line.
  const lines: string[][] = []          // lines[i] = token values for original line i
  const lineTokens = new Map<number, Token[]>()

  for (const tok of tokens) {
    const lineN = tok.line
    if (!lineTokens.has(lineN)) lineTokens.set(lineN, [])
    lineTokens.get(lineN)!.push(tok)
  }

  // Determine indentation depth by tracking { and } at line boundaries
  // We re-compute indentation for each line based on brace depth
  let depth = 0
  const maxLine = Math.max(...lineTokens.keys())
  const resultLines: string[] = []

  // Fill in blank lines from original source
  const srcLines = normalised.split('\n')

  for (let i = 1; i <= maxLine; i++) {
    const toks = lineTokens.get(i)
    if (!toks || toks.length === 0) {
      // Preserve blank line
      resultLines.push('')
      continue
    }

    // Adjust depth: if first token is }, decrease before emitting
    const firstTok = toks[0]
    if (firstTok.type === 'RBRACE') {
      depth = Math.max(0, depth - 1)
    }

    // Reconstruct line with spacing
    let lineOut = ''
    for (let j = 0; j < toks.length; j++) {
      const tok = toks[j]
      const prev = toks[j - 1]
      if (j === 0) {
        lineOut = tok.value
      } else {
        const sep = needsSpace(prev, tok) ? ' ' : ''
        lineOut += sep + tok.value
      }
    }

    // Add indentation (2 spaces per depth)
    const indent = '  '.repeat(depth)
    resultLines.push(indent + lineOut)

    // Adjust depth after emitting: count net braces
    for (const t of toks) {
      if (t.type === 'LBRACE') depth++
      else if (t.type === 'RBRACE' && !(t === firstTok)) depth = Math.max(0, depth - 1)
    }
  }

  // Re-append any trailing blank lines from original
  const trailingBlanks = srcLines.slice(maxLine).filter((_, idx) => idx > 0 && srcLines[maxLine + idx] === '').length
  if (normalised.endsWith('\n')) resultLines.push('')

  const formatted = resultLines.join('\n')
  return { formatted, changed: formatted !== normalised }
}
