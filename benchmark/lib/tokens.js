'use strict'

// Token counting for benchmark tracks (cl100k_base via js-tiktoken).
// Used for static source comparison and live session cost estimation.

const fs = require('fs')
const path = require('path')

let _encoder = null

function getEncoder() {
  if (_encoder) return _encoder
  const { getEncoding } = require('js-tiktoken')
  _encoder = getEncoding('cl100k_base')
  return _encoder
}

function countTokens(text) {
  if (!text) return 0
  return getEncoder().encode(text).length
}

function loadPricing() {
  const file = path.join(__dirname, '..', 'config', 'pricing.json')
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function estimateCostUsd(inputTokens, outputTokens, pricing = loadPricing()) {
  return (inputTokens / 1e6) * pricing.inputPer1M + (outputTokens / 1e6) * pricing.outputPer1M
}

// Strip Axon metadata annotations and @test blocks for logic-only comparison.
function stripAxonMetadata(source) {
  return source
    .split('\n')
    .filter((line) => !/^\s*@(intent|pure|total|effects|memo|exhaustive|throws|test)\b/.test(line))
    .filter((line) => !/^\s*@test\s/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Strip block and line comments from TypeScript for logic-only comparison.
function stripTsComments(source) {
  let out = source
  out = out.replace(/\/\*[\s\S]*?\*\//g, '')
  out = out.replace(/^\s*\/\/.*$/gm, '')
  return out.replace(/\n{3,}/g, '\n\n').trim()
}

// README excerpt used as Axon-only language context in simulated prompts.
let _readmeExcerpt = null

function getReadmeExcerpt(repoRoot) {
  if (_readmeExcerpt) return _readmeExcerpt
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8')
  const start = readme.indexOf('## Language Tour')
  const end = readme.indexOf('## Demos')
  _readmeExcerpt = start >= 0 && end > start ? readme.slice(start, end).trim() : readme.slice(0, 4000)
  return _readmeExcerpt
}

function buildSimulatedPrompt(taskSpec, language, repoRoot) {
  const lines = [
    `Implement the following task in ${language === 'axon' ? 'Axon (.axn)' : 'TypeScript'}.`,
    '',
    '## Task',
    taskSpec,
    '',
    'Return only the source code for a single file. Include tests inline (@test for Axon) or export functions for external testing (TypeScript).',
  ]
  if (language === 'axon') {
    lines.push('', '## Axon language reference (from README)', getReadmeExcerpt(repoRoot))
  }
  return lines.join('\n')
}

function analyzeSourcePair({
  taskId,
  axonSource,
  tsSource,
  taskSpec,
  repoRoot,
  axonCompiled = null,
  tsCompiled = null,
}) {
  const axonPrompt = buildSimulatedPrompt(taskSpec, 'axon', repoRoot)
  const tsPrompt = buildSimulatedPrompt(taskSpec, 'typescript', repoRoot)

  const axonFull = countTokens(axonSource)
  const tsFull = countTokens(tsSource)
  const axonLogic = countTokens(stripAxonMetadata(axonSource))
  const tsLogic = countTokens(stripTsComments(tsSource))
  const axonPromptTokens = countTokens(axonPrompt)
  const tsPromptTokens = countTokens(tsPrompt)

  // Compiled-output tokens: the artifact the codegen work actually changes.
  // TS "compiled" baseline falls back to its source (≈ its emitted JS minus types).
  const axonCompiledTokens = axonCompiled != null ? countTokens(axonCompiled) : null
  const tsCompiledTokens = tsCompiled != null ? countTokens(tsCompiled) : tsFull

  const pricing = loadPricing()

  return {
    taskId,
    axon: {
      outputTokens: axonFull,
      logicTokens: axonLogic,
      promptTokens: axonPromptTokens,
      compiledTokens: axonCompiledTokens,
      estimatedGenerationCostUsd: estimateCostUsd(axonPromptTokens, axonFull, pricing),
    },
    typescript: {
      outputTokens: tsFull,
      logicTokens: tsLogic,
      promptTokens: tsPromptTokens,
      compiledTokens: tsCompiledTokens,
      estimatedGenerationCostUsd: estimateCostUsd(tsPromptTokens, tsFull, pricing),
    },
    ratios: {
      outputTokens: axonFull / (tsFull || 1),
      logicTokens: axonLogic / (tsLogic || 1),
      promptTokens: axonPromptTokens / (tsPromptTokens || 1),
      compiledTokens: axonCompiledTokens != null ? axonCompiledTokens / (tsCompiledTokens || 1) : null,
    },
  }
}

function summarizeTokenPairs(pairs) {
  const sum = (lang, field) => pairs.reduce((a, p) => a + p[lang][field], 0)
  const axonOut = sum('axon', 'outputTokens')
  const tsOut = sum('typescript', 'outputTokens')
  const axonLogic = sum('axon', 'logicTokens')
  const tsLogic = sum('typescript', 'logicTokens')
  const axonPrompt = sum('axon', 'promptTokens')
  const tsPrompt = sum('typescript', 'promptTokens')

  const compiledPairs = pairs.filter((p) => p.axon.compiledTokens != null)
  const axonCompiled = compiledPairs.reduce((a, p) => a + p.axon.compiledTokens, 0)
  const tsCompiled = compiledPairs.reduce((a, p) => a + p.typescript.compiledTokens, 0)

  return {
    taskCount: pairs.length,
    axonOutputTokens: axonOut,
    tsOutputTokens: tsOut,
    axonLogicTokens: axonLogic,
    tsLogicTokens: tsLogic,
    axonCompiledTokens: compiledPairs.length ? axonCompiled : null,
    tsCompiledTokens: compiledPairs.length ? tsCompiled : null,
    ratios: {
      outputTokens: axonOut / (tsOut || 1),
      logicTokens: axonLogic / (tsLogic || 1),
      promptTokens: axonPrompt / (tsPrompt || 1),
      compiledTokens: compiledPairs.length ? axonCompiled / (tsCompiled || 1) : null,
    },
    note: 'cl100k_base proxy via js-tiktoken; Claude/GPT counts may differ slightly.',
  }
}

function analyzeSessionTurns(turns, pricing = loadPricing()) {
  let sessionInputTokens = 0
  let sessionOutputTokens = 0
  const analyzed = []

  for (const turn of turns) {
    const tokens = countTokens(turn.content || '')
    if (turn.role === 'user' || turn.role === 'system') sessionInputTokens += tokens
    else sessionOutputTokens += tokens
    analyzed.push({ ...turn, tokens })
  }

  return {
    turns: analyzed,
    sessionInputTokens,
    sessionOutputTokens,
    sessionTotalTokens: sessionInputTokens + sessionOutputTokens,
    sessionCostUsd: estimateCostUsd(sessionInputTokens, sessionOutputTokens, pricing),
  }
}

module.exports = {
  countTokens,
  loadPricing,
  estimateCostUsd,
  stripAxonMetadata,
  stripTsComments,
  getReadmeExcerpt,
  buildSimulatedPrompt,
  analyzeSourcePair,
  summarizeTokenPairs,
  analyzeSessionTurns,
}
