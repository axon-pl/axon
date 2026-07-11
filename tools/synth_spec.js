/**
 * synth spec — extract AI-queryable metadata from Synth AST (v1.2 spike).
 *
 * Schema version: 0.1  (freeze as 1.0 at v2.0)
 *
 * {
 *   synthSpecVersion, file,
 *   functions: [{ name, line, intent, annotations, params, returnType, likely, exactMatchArms }],
 *   types: [{ name, line, type, constraint }],
 *   refines: [{ name, claim, line? }]
 * }
 */

'use strict'

function typeToString(t) {
  if (t == null) return null
  if (typeof t === 'string') return t
  if (t.kind === 'FnType' || t.name === 'fn') {
    // best-effort
  }
  let s = t.name != null ? String(t.name) : JSON.stringify(t)
  if (t.isArray) s += '[]'
  if (t.isOptional) s += '?'
  if (t.typeArgs && t.typeArgs.length) {
    s += '<' + t.typeArgs.map(typeToString).join(', ') + '>'
  }
  return s
}

function constraintToJson(c) {
  if (!c) return null
  const out = { kind: c.kind }
  if (c.op != null) out.op = c.op
  if (c.value != null) out.value = c.value
  if (c.pattern != null) out.pattern = c.pattern
  if (c.flags != null && c.flags !== '') out.flags = c.flags
  return out
}

function litSummary(expr) {
  if (!expr) return null
  if (expr.kind === 'StringLit') return JSON.stringify(expr.value)
  if (expr.kind === 'IntLit' || expr.kind === 'FloatLit' || expr.kind === 'NumberLit') {
    return String(expr.value)
  }
  if (expr.kind === 'BoolLit') return String(expr.value)
  if (expr.kind === 'Identifier') return expr.name
  return expr.kind || null
}

function walk(node, visit) {
  if (node == null || typeof node !== 'object') return
  visit(node)
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit)
    return
  }
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue
    const v = node[key]
    if (v && typeof v === 'object') walk(v, visit)
  }
}

function collectMatchMeta(body) {
  const likely = []
  const exact = []
  walk(body, (n) => {
    if (!n || n.kind !== 'MatchExpr' || !Array.isArray(n.arms)) return
    for (const arm of n.arms) {
      const pat = arm.pattern
      if (!pat) continue
      if (pat.kind === 'LikelyPat') {
        likely.push({
          claim: pat.claim,
          result: litSummary(arm.body),
        })
      } else if (pat.kind === 'LiteralPat') {
        exact.push({
          value: pat.value,
          result: litSummary(arm.body),
        })
      }
    }
  })
  return { likely, exactMatchArms: exact }
}

function collectRefines(ast) {
  const refines = []
  walk(ast, (n) => {
    if (n && n.kind === 'RefineStmt') {
      refines.push({ name: n.name, claim: n.claim, line: n.line ?? null })
    }
  })
  return refines
}

function extractFn(decl) {
  const anns = Array.isArray(decl.annotations) ? decl.annotations : []
  const intentAnn = anns.find((a) => a && a.name === 'intent')
  const { likely, exactMatchArms } = collectMatchMeta(decl.body)
  return {
    name: decl.name,
    line: decl.line ?? null,
    intent: intentAnn && intentAnn.value != null ? String(intentAnn.value) : null,
    annotations: anns.map((a) => ({
      name: a.name,
      value: a.value == null ? null : a.value,
    })),
    params: (decl.params || []).map((p) => ({
      name: p.name,
      type: typeToString(p.type),
      spread: !!p.spread,
    })),
    returnType: typeToString(decl.returnType),
    likely,
    exactMatchArms,
  }
}

function extractTypeAlias(decl) {
  return {
    name: decl.name,
    line: decl.line ?? null,
    type: typeToString(decl.type),
    constraint: constraintToJson(decl.constraint),
  }
}

/**
 * @param {object} ast Program AST from bootstrap parse()
 * @param {{ file?: string }} opts
 */
function extractSpec(ast, opts = {}) {
  const functions = []
  const types = []

  const body = (ast && ast.body) || []
  for (const decl of body) {
    if (!decl || !decl.kind) continue
    if (decl.kind === 'FnDecl') {
      functions.push(extractFn(decl))
    } else if (decl.kind === 'TypeAlias') {
      types.push(extractTypeAlias(decl))
    } else if (decl.kind === 'ExportDecl' && decl.decl) {
      if (decl.decl.kind === 'FnDecl') functions.push(extractFn(decl.decl))
      if (decl.decl.kind === 'TypeAlias') types.push(extractTypeAlias(decl.decl))
    }
  }

  return {
    synthSpecVersion: '0.1',
    file: opts.file || null,
    functions,
    types,
    refines: collectRefines(ast),
  }
}

/**
 * @param {{ tokenize: Function, parse: Function }} compiler
 * @param {string} source
 * @param {{ file?: string }} opts
 */
function specFromSource(compiler, source, opts = {}) {
  const tokens = compiler.tokenize(source)
  const ast = compiler.parse(tokens)
  return extractSpec(ast, opts)
}

module.exports = {
  extractSpec,
  specFromSource,
  typeToString,
}
