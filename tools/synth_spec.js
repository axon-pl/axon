/**
 * synth spec — extract AI-queryable metadata from Synth AST (v1.2).
 *
 * Schema version: 0.1  (aim to freeze as 1.0 at v2.0)
 *
 * {
 *   synthSpecVersion: "0.1",
 *   entry: "examples/foo.syn",
 *   modules: [{
 *     file, functions, types, refines
 *   }]
 * }
 *
 * functions[]: { name, line, intent, annotations, params, returnType, likely, exactMatchArms }
 * types[]:     { name, line, type, constraint }
 * refines[]:   { name, claim, line? }
 */

'use strict'

const fs = require('fs')
const path = require('path')
const { resolveModuleOrder } = require('./bootstrap_common')

function typeToString(t) {
  if (t == null) return null
  if (typeof t === 'string') return t
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
    if (!n || n.kind !== 'MatchExpr' || n.arms == null) return
    for (const arm of hostList(n.arms)) {
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

/** Host-realm copy — bootstrap AST arrays come from a vm context. */
function hostList(xs) {
  return Array.prototype.slice.call(xs || [])
}

function extractFn(decl) {
  const anns = hostList(decl.annotations)
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
    params: hostList(decl.params).map((p) => ({
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
function extractModuleSpec(ast, opts = {}) {
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
    file: opts.file || null,
    functions,
    types,
    refines: collectRefines(ast),
  }
}

/** @deprecated use extractModuleSpec — kept for callers expecting flat single-file shape */
function extractSpec(ast, opts = {}) {
  const mod = extractModuleSpec(ast, opts)
  return {
    synthSpecVersion: '0.1',
    file: mod.file,
    functions: mod.functions,
    types: mod.types,
    refines: mod.refines,
  }
}

function relFile(root, absPath) {
  return path.relative(root, absPath).replace(/\\/g, '/')
}

/**
 * Spec one source string (single module).
 */
function specFromSource(compiler, source, opts = {}) {
  const tokens = compiler.tokenize(source)
  const ast = compiler.parse(tokens)
  const mod = extractModuleSpec(ast, opts)
  return {
    synthSpecVersion: '0.1',
    entry: opts.file || null,
    modules: [mod],
  }
}

/**
 * Spec an entry file; follows imports like --bundle.
 * @param {{ tokenize: Function, parse: Function }} compiler
 * @param {string} entryPath absolute path
 * @param {{ root?: string }} opts
 */
function specFromEntry(compiler, entryPath, opts = {}) {
  const root = opts.root || path.join(__dirname, '..')
  const abs = path.resolve(entryPath)
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}`)
  }
  const modules = resolveModuleOrder(abs)
  const out = []
  for (const mod of modules) {
    const tokens = compiler.tokenize(mod.source)
    const ast = compiler.parse(tokens)
    out.push(extractModuleSpec(ast, { file: relFile(root, mod.absPath) }))
  }
  return {
    synthSpecVersion: '0.1',
    entry: relFile(root, abs),
    modules: out,
  }
}

module.exports = {
  extractSpec,
  extractModuleSpec,
  specFromSource,
  specFromEntry,
  typeToString,
}
