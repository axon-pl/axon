'use strict'

// Reads benchmark/results/*.json from each track and synthesizes a markdown
// report plus a structured verdict JSON.

const fs = require('fs')
const path = require('path')

const BENCH = path.join(__dirname, '..')
const REPO = path.join(BENCH, '..')
const RESULTS = path.join(BENCH, 'results')

function readTrack(name) {
  const file = path.join(RESULTS, `${name}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function pct(n) {
  return typeof n === 'number' ? `${Math.round(n * 100)}%` : 'n/a'
}

function ratio(n) {
  return typeof n === 'number' ? `${n.toFixed(2)}×` : 'n/a'
}

function fmtMs(ms) {
  if (ms == null) return 'n/a'
  return ms >= 1 ? `${ms.toFixed(2)} ms` : `${(ms * 1000).toFixed(1)} µs`
}

function fmtUsd(n) {
  if (n == null) return 'n/a'
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(3)}`
}

function verdictFromTracks(a, b, c, d) {
  const risks = []
  const strengths = []
  let score = 0

  if (a) {
    const passRate = a.summary.totalAssertions ? a.summary.totalPassed / a.summary.totalAssertions : 0
    if (passRate >= 0.95) {
      score += 2
      strengths.push(`Correctness: ${a.summary.totalPassed}/${a.summary.totalAssertions} inline @test assertions pass (${pct(passRate)}).`)
    } else if (passRate >= 0.85) {
      score += 1
      strengths.push(`Correctness mostly solid (${pct(passRate)} pass) but ${a.summary.totalFailed} assertion(s) still fail.`)
    } else {
      risks.push(`Correctness: only ${pct(passRate)} of bundled example @tests pass — compiler/runtime gaps remain.`)
    }
    if (a.summary.adversarialExpectedBehavior < a.summary.adversarialCases) {
      risks.push(
        `Edge cases: ${a.summary.adversarialExpectedBehavior}/${a.summary.adversarialCases} adversarial probes behaved as documented.`
      )
    } else {
      score += 1
      strengths.push('Edge-case probes match documented semantics.')
    }
    if (a.bundleReproducible === false) risks.push('Bundle output is not reproducible vs checked-in reference.')
  }

  if (b) {
    const rpg = (b.perStage || []).find((r) => r.file && r.file.endsWith('rpg.axn'))
    if (rpg && rpg.totalMs < 500) {
      score += 1
      strengths.push(`Compiler speed: rpg.axn (${rpg.lines} lines) transpiles in ${fmtMs(rpg.totalMs)} median.`)
    }
    if (b.scalingVerdict === 'linear' || b.scalingVerdict === 'mildly superlinear') {
      score += 1
    } else if (b.scalingVerdict) {
      risks.push(`Compiler scaling is ${b.scalingVerdict} — may struggle on very large files.`)
    }
  }

  if (c) {
    const overhead = c.dungeon && c.dungeon.overheadRatio
    if (overhead != null && overhead <= 1.15) {
      score += 2
      strengths.push(`Runtime: generated JS is ${overhead.toFixed(2)}× hand-written for dungeon generator (negligible tax).`)
    } else if (overhead != null && overhead <= 1.5) {
      score += 1
      strengths.push(`Runtime overhead modest (${overhead.toFixed(2)}×) on loop-heavy codegen.`)
    } else if (overhead != null) {
      risks.push(`Runtime: ${overhead.toFixed(2)}× slower than hand-written JS on dungeon generator.`)
    }
    if (c.memo && c.memo.memoized === false) risks.push('@memo caching did not measurably speed repeat calls.')
    if (c.codeSize && c.codeSize.axonSrcLines && c.codeSize.tsSrcLines) {
      const srcRatio = c.codeSize.axonSrcLines / c.codeSize.tsSrcLines
      if (srcRatio > 1.3) {
        risks.push(`Source verbosity: controls.axn is ${srcRatio.toFixed(2)}× longer than the TS twin (annotations/metadata).`)
      }
    }
  }

  if (d) {
    const agg = d.static && d.static.aggregate
    if (agg) {
      if (agg.ratios.logicTokens <= 1.05) {
        score += 1
        strengths.push(`Token economy (logic-only): Axon within 5% of TypeScript (${ratio(agg.ratios.logicTokens)}).`)
      } else if (agg.ratios.logicTokens <= 1.2) {
        strengths.push(`Token economy (logic-only): Axon ${ratio(agg.ratios.logicTokens)} TypeScript — near parity.`)
      } else {
        risks.push(`Token economy (logic-only): Axon ${ratio(agg.ratios.logicTokens)} TypeScript output tokens.`)
      }
      if (agg.ratios.outputTokens > 1.4) {
        risks.push(
          `Full Axon output (with @intent/@test metadata) is ${ratio(agg.ratios.outputTokens)} TypeScript — metadata tax on generation cost.`
        )
      }
      if (agg.ratios.promptTokens > 1.2) {
        risks.push(`Axon prompts include README context (${ratio(agg.ratios.promptTokens)} TS prompt size).`)
      }
      if (agg.ratios.compiledTokens != null) {
        strengths.push(
          `Compiled JS output: transpiled Axon is ${ratio(agg.ratios.compiledTokens)} TS source in tokens — the metric that tracks codegen/token-reduction work (informational; not scored).`
        )
      }
    }

    if (d.harnessSanity && d.harnessSanity.allOk) {
      strengths.push('Track D harness sanity: all reference answer keys pass acceptance tests.')
    } else if (d.harnessSanity) {
      risks.push('Track D harness sanity failed — acceptance tests or reference solutions need fixing.')
    }

    const live = d.live
    if (live && live.status === 'complete' && live.summary) {
      const ax = live.summary.axon
      const ts = live.summary.typescript
      if (ax.firstAttemptPassRate >= ts.firstAttemptPassRate) {
        score += 1
        strengths.push(
          `Live sessions: Axon first-attempt pass ${pct(ax.firstAttemptPassRate)} vs TS ${pct(ts.firstAttemptPassRate)}.`
        )
      } else {
        risks.push(
          `Live sessions: Axon first-attempt pass ${pct(ax.firstAttemptPassRate)} vs TS ${pct(ts.firstAttemptPassRate)}.`
        )
      }
      if (ax.avgSessionCostUsd && ts.avgSessionCostUsd) {
        const costRatio = ax.avgSessionCostUsd / ts.avgSessionCostUsd
        if (costRatio <= 1.0) {
          score += 1
          strengths.push(`Live session cost: Axon ${fmtUsd(ax.avgSessionCostUsd)} avg vs TS ${fmtUsd(ts.avgSessionCostUsd)} (${ratio(costRatio)}).`)
        } else if (costRatio > 1.2 && ax.firstAttemptPassRate <= ts.firstAttemptPassRate) {
          risks.push(
            `Live session cost: Axon ${ratio(costRatio)} TS with no first-attempt pass advantage — token-reduction claim not supported.`
          )
        }
      }
    } else if (live?.status !== 'complete') {
      risks.push('Track D live sessions not run — populate live-sessions/ and re-run with --live to measure session cost.')
    } else if (live.referenceBacked) {
      risks.push('Track D live sessions are reference-backed bootstrap — replace with real agent transcripts for AI cost measurement.')
    }
  }

  risks.push('Pre-1.0 spec: v0.8 today, LSP/source maps planned v0.9 — expect churn before stability promise.')
  risks.push('Tooling gap: no IDE diagnostics yet; human review of AI output is harder than TypeScript.')
  risks.push('Ecosystem: transpiles to JS but no npm interop story beyond calling JS builtins.')

  let recommendation
  if (score >= 7) recommendation = 'promising-for-ai-pipelines'
  else if (score >= 5) recommendation = 'worth-piloting-on-pure-logic'
  else if (score >= 3) recommendation = 'wait-for-v1'
  else recommendation = 'not-ready'

  const labels = {
    'promising-for-ai-pipelines': 'Promising for AI code-generation pipelines on pure logic modules',
    'worth-piloting-on-pure-logic': 'Worth a bounded pilot on pure logic; keep DOM/npm in TypeScript',
    'wait-for-v1': 'Interesting design, but wait for v1.0 stability and tooling before betting a project on it',
    'not-ready': 'Not ready for adoption — correctness or performance gaps block practical use',
  }

  return { score, maxScore: 9, recommendation, recommendationLabel: labels[recommendation], strengths, risks }
}

function renderMarkdown(tracks, verdict) {
  const { a, b, c, d } = tracks
  const lines = []
  const ts = new Date().toISOString()

  lines.push('# Axon Benchmark Report')
  lines.push('')
  lines.push(`Generated: ${ts}`)
  if (a) lines.push(`Environment: Node ${a.node} on ${a.platform}`)
  lines.push('')

  lines.push('## Verdict')
  lines.push('')
  lines.push(`**${verdict.recommendationLabel}** (score ${verdict.score}/${verdict.maxScore})`)
  lines.push('')
  if (verdict.strengths.length) {
    lines.push('### Strengths')
    for (const s of verdict.strengths) lines.push(`- ${s}`)
    lines.push('')
  }
  if (verdict.risks.length) {
    lines.push('### Risks & limitations')
    for (const r of verdict.risks) lines.push(`- ${r}`)
    lines.push('')
  }

  if (a) {
    lines.push('## Track A — Correctness')
    lines.push('')
    lines.push(
      `| Metric | Value |`,
      `| --- | --- |`,
      `| Example @tests | ${a.summary.totalPassed}/${a.summary.totalAssertions} passed (${a.summary.exampleFilesRun} files) |`,
      `| Adversarial probes | ${a.summary.adversarialExpectedBehavior}/${a.summary.adversarialCases} as expected |`,
      `| Bundle reproducible | ${a.bundleReproducible ? 'yes' : 'no'} |`,
      ``
    )
    if (a.v08Coverage) {
      lines.push('### v0.8 feature coverage')
      lines.push(`- chronicle compiles: ${a.v08Coverage.chronicleCompiles}`)
      lines.push(`- pure helpers run: ${a.v08Coverage.pureHelpersOk}`)
      lines.push('')
    }
    if (a.errorQuality) {
      lines.push('### Error-message quality')
      lines.push(`- Actionable diagnostics: ${a.errorQuality.actionable}/${a.errorQuality.probes} probes`)
      lines.push('')
    }
    if (a.findings && a.findings.length) {
      lines.push(`<details><summary>Findings (${a.findings.length})</summary>`)
      lines.push('')
      for (const f of a.findings) lines.push(`- ${f}`)
      lines.push('</details>')
      lines.push('')
    }
  }

  if (b) {
    lines.push('## Track B — Compiler performance')
    lines.push('')
    const rpg = (b.perStage || []).find((r) => r.file && r.file.endsWith('rpg.axn'))
    if (rpg) {
      lines.push(`- Largest file: \`${path.basename(rpg.file)}\` — ${rpg.lines} lines, ${fmtMs(rpg.totalMs)} median transpile`)
    }
    lines.push(`- Scaling verdict: **${b.scalingVerdict}**`)
    if (b.tscBaseline) {
      lines.push(`- Rough tsc reference: ${Math.round(b.tscBaseline.linesPerSec).toLocaleString()} lines/sec (cold process; see note in JSON)`)
    }
    lines.push('')
  }

  if (c) {
    lines.push('## Track C — Runtime performance')
    lines.push('')
    if (c.dungeon) {
      lines.push(
        `- Dungeon generator: **${c.dungeon.overheadRatio.toFixed(3)}×** vs hand-written JS (${c.dungeon.seedsVerifiedEqual ? 'outputs verified equal' : 'output mismatch'})`
      )
    }
    if (c.whereGuard) {
      lines.push(`- \`where\` guard overhead: +${c.whereGuard.overheadPct.toFixed(0)}% on trivial add`)
    }
    if (c.memo) {
      lines.push(`- @memo effective: ${c.memo.memoized ? 'yes' : 'no'} (${Math.round(c.memo.speedup).toLocaleString()}× cached vs cold)`)
    }
    if (c.codeSize) {
      lines.push(
        `- Code size: axon src ${c.codeSize.axonSrcLines} lines → emitted ${c.codeSize.axonJsLines} lines (${c.codeSize.axonJsPreludeLines} prelude)`
      )
    }
    lines.push('')
  }

  if (d) {
    lines.push('## Track D — AI-native writability + token/cost')
    lines.push('')

    const live = d.live
    const liveSummary = live && live.summary
    lines.push('### Live sessions (primary — session cost to ship working code)')
    lines.push('')
    if (live && live.status === 'complete' && liveSummary) {
      if (live.referenceBacked) {
        lines.push('_Sessions are **reference-backed** (bootstrap) — costs/tokens reflect answer keys, not real AI runs._')
        lines.push('')
      }
      lines.push('| Language | First-attempt pass | Avg fix iterations | Avg output tokens | Est. session cost |')
      lines.push('| --- | --- | --- | --- | --- |')
      lines.push(
        `| Axon | ${pct(liveSummary.axon.firstAttemptPassRate)} | ${liveSummary.axon.avgFixIterations.toFixed(1)} | ${Math.round(liveSummary.axon.avgSessionOutputTokens)} | ${fmtUsd(liveSummary.axon.avgSessionCostUsd)} |`
      )
      lines.push(
        `| TypeScript | ${pct(liveSummary.typescript.firstAttemptPassRate)} | ${liveSummary.typescript.avgFixIterations.toFixed(1)} | ${Math.round(liveSummary.typescript.avgSessionOutputTokens)} | ${fmtUsd(liveSummary.typescript.avgSessionCostUsd)} |`
      )
    } else {
      lines.push(`_Live sessions: **${live ? live.status : 'not run'}** — populate \`benchmark/track-d-ai-native/live-sessions/\` and run \`node benchmark/track-d-ai-native/run.js --live\`._`)
    }
    lines.push('')

    const agg = d.static && d.static.aggregate
    lines.push('### Token economy (diagnostic — static reference solutions)')
    lines.push('')
    if (agg) {
      lines.push('| Metric | Axon / TS ratio |')
      lines.push('| --- | --- |')
      lines.push(`| Full output tokens | ${ratio(agg.ratios.outputTokens)} |`)
      lines.push(`| Logic-only tokens (metadata stripped) | ${ratio(agg.ratios.logicTokens)} |`)
      lines.push(`| Simulated prompt tokens | ${ratio(agg.ratios.promptTokens)} |`)
      if (agg.ratios.compiledTokens != null) {
        lines.push(`| Compiled JS output (transpiled) | ${ratio(agg.ratios.compiledTokens)} |`)
      }
      lines.push('')
      if (agg.ratios.compiledTokens != null) {
        lines.push('_Compiled JS row is the artifact codegen changes move; source rows are stable across compiler versions._')
        lines.push('')
      }
      lines.push(`_${agg.note || 'cl100k_base proxy via js-tiktoken'}_`)
    }
    lines.push('')

    if (d.harnessSanity) {
      lines.push(
        `### Harness sanity (${d.harnessSanity.allOk ? 'OK' : 'FAILED'})`,
        '',
        '_Reference solutions in `solutions/` are hidden answer keys — they validate the acceptance harness, not AI writability._',
        ''
      )
    }
  }

  lines.push('## How to reproduce')
  lines.push('')
  lines.push('```bash')
  lines.push('npm ci && npx tsc')
  lines.push('node benchmark/run-all.js              # static Track D (token economy)')
  lines.push('node benchmark/track-d-ai-native/run.js --live   # after populating live-sessions/')
  lines.push('# or: docker compose -f benchmark/docker-compose.yml run --rm bench')
  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

// ── Standalone HTML report ────────────────────────────────────────────────────
// Self-contained (inline CSS + inline SVG charts, no external deps, works
// offline in any browser). Mirrors the dashboard layout. Axon = blue, TS = green.

const AXON_COLOR = '#3b82f6'
const TS_COLOR = '#22c55e'

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// Grouped vertical bar chart (two series) as inline SVG.
function groupedBarSvg(categories, seriesA, seriesB, opts = {}) {
  const w = opts.width || 460
  const h = opts.height || 220
  const padL = 8
  const padB = 46
  const padT = 12
  const plotH = h - padB - padT
  const plotW = w - padL * 2
  const max = Math.max(1, ...seriesA.data, ...seriesB.data)
  const groups = categories.length
  const groupW = plotW / groups
  const barW = Math.min(22, groupW / 3)
  const bars = []
  const labels = []
  categories.forEach((cat, i) => {
    const gx = padL + i * groupW + groupW / 2
    const aH = (seriesA.data[i] / max) * plotH
    const bH = (seriesB.data[i] / max) * plotH
    const ax = gx - barW - 2
    const bx = gx + 2
    bars.push(
      `<rect x="${ax.toFixed(1)}" y="${(padT + plotH - aH).toFixed(1)}" width="${barW}" height="${aH.toFixed(1)}" rx="2" fill="${seriesA.color}"><title>${esc(seriesA.name)} · ${esc(cat)}: ${seriesA.data[i]}</title></rect>`,
      `<rect x="${bx.toFixed(1)}" y="${(padT + plotH - bH).toFixed(1)}" width="${barW}" height="${bH.toFixed(1)}" rx="2" fill="${seriesB.color}"><title>${esc(seriesB.name)} · ${esc(cat)}: ${seriesB.data[i]}</title></rect>`
    )
    labels.push(
      `<text x="${gx.toFixed(1)}" y="${h - padB + 16}" font-size="10" fill="#9ca3af" text-anchor="middle" transform="rotate(0 ${gx.toFixed(1)} ${h - padB + 16})">${esc(cat)}</text>`
    )
  })
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" role="img">
    <line x1="${padL}" y1="${padT + plotH}" x2="${w - padL}" y2="${padT + plotH}" stroke="#374151" stroke-width="1"/>
    ${bars.join('\n    ')}
    ${labels.join('\n    ')}
  </svg>`
}

// Horizontal bar chart (single series) as inline SVG.
function horizBarSvg(rows, opts = {}) {
  const w = opts.width || 460
  const rowH = 30
  const h = rows.length * rowH + 10
  const labelW = 96
  const plotW = w - labelW - 60
  const max = Math.max(1, ...rows.map((r) => r.value))
  const bars = rows
    .map((r, i) => {
      const y = i * rowH + 6
      const bw = (r.value / max) * plotW
      return `<text x="0" y="${y + 15}" font-size="11" fill="#d1d5db">${esc(r.label)}</text>
      <rect x="${labelW}" y="${y + 4}" width="${bw.toFixed(1)}" height="16" rx="3" fill="${opts.color || AXON_COLOR}"/>
      <text x="${labelW + bw + 6}" y="${y + 16}" font-size="10" fill="#9ca3af">${esc(r.suffix ? r.value + r.suffix : r.value)}</text>`
    })
    .join('\n    ')
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" role="img">${bars}</svg>`
}

function ratioBarHtml(label, value, note) {
  if (value == null) return ''
  const worse = value > 1.05
  const pctFill = Math.min(value / 4, 1) * 100
  return `<div class="ratio">
    <div class="ratio-head"><span>${esc(label)}</span><strong class="${worse ? 'bad' : 'ok'}">${value.toFixed(2)}×</strong></div>
    <div class="ratio-track"><div class="ratio-fill ${worse ? 'bad' : 'ok'}" style="width:${pctFill.toFixed(1)}%"></div></div>
    ${note ? `<div class="ratio-note">${esc(note)}</div>` : ''}
  </div>`
}

function legendHtml() {
  return `<div class="legend"><span><i style="background:${AXON_COLOR}"></i>Axon</span><span><i style="background:${TS_COLOR}"></i>TypeScript</span></div>`
}

function renderHtml(tracks, verdict) {
  const { a, b, c, d } = tracks
  const genTs = new Date().toISOString()
  const env = a ? `Node ${a.node} · ${a.platform}` : ''

  // Track A
  const passed = a ? a.summary.totalPassed : 0
  const total = a ? a.summary.totalAssertions : 0
  const passPct = total ? Math.round((passed / total) * 100) : 0
  const advOk = a ? a.summary.adversarialExpectedBehavior : 0
  const advTotal = a ? a.summary.adversarialCases : 0

  // Track B
  const perStage = (b && b.perStage) || []
  const rpg = perStage.find((r) => r.file && r.file.endsWith('rpg.axn'))
  const topFiles = [...perStage].sort((x, y) => (y.lines || 0) - (x.lines || 0)).slice(0, 6)

  // Track C
  const overhead = c && c.dungeon ? c.dungeon.overheadRatio : null
  const guardPct = c && c.whereGuard ? c.whereGuard.overheadPct : null
  const memoSpeedup = c && c.memo ? c.memo.speedup : null
  const srcRatio = c && c.codeSize && c.codeSize.tsSrcLines ? c.codeSize.axonSrcLines / c.codeSize.tsSrcLines : null

  // Track D
  const pairs = (d && d.static && d.static.pairs ? d.static.pairs : []).filter((p) => p.taskId !== 'controls')
  const agg = d && d.static && d.static.aggregate
  const cats = pairs.map((p) => p.taskId.replace(/_/g, ' '))
  const axonTokens = pairs.map((p) => p.axon.outputTokens)
  const tsTokens = pairs.map((p) => p.typescript.outputTokens)
  const axonCost = pairs.map((p) => +(p.axon.estimatedGenerationCostUsd * 1000).toFixed(2))
  const tsCost = pairs.map((p) => +(p.typescript.estimatedGenerationCostUsd * 1000).toFixed(2))

  const tokenChart = pairs.length
    ? `<div class="card"><div class="card-h">Output tokens by task <span class="trailing">cl100k_base proxy</span></div><div class="card-b">
        ${groupedBarSvg(cats, { name: 'Axon', data: axonTokens, color: AXON_COLOR }, { name: 'TypeScript', data: tsTokens, color: TS_COLOR })}
        ${legendHtml()}
        <div class="cap">Y: output tokens (full source) · X: benchmark tasks</div>
      </div></div>`
    : ''

  const costChart = pairs.length
    ? `<div class="card"><div class="card-h">Est. generation cost by task <span class="trailing">$3/M in · $15/M out</span></div><div class="card-b">
        ${groupedBarSvg(cats, { name: 'Axon', data: axonCost, color: AXON_COLOR }, { name: 'TypeScript', data: tsCost, color: TS_COLOR })}
        ${legendHtml()}
        <div class="cap">Y: estimated USD × 1000 (millicents) · prompt input + output</div>
      </div></div>`
    : ''

  const ratios = agg
    ? `<div class="card"><div class="card-h">Aggregate Axon / TypeScript ratios <span class="trailing">ratio &gt; 1.0 = Axon costs more</span></div><div class="card-b">
        <div class="ratio-grid">
          ${ratioBarHtml('Full output tokens', agg.ratios.outputTokens, '@intent, @pure, @test metadata included')}
          ${ratioBarHtml('Logic-only tokens', agg.ratios.logicTokens, 'annotations stripped')}
          ${ratioBarHtml('Simulated prompt tokens', agg.ratios.promptTokens, 'Axon pays README context tax')}
          ${ratioBarHtml('Compiled JS output (transpiled)', agg.ratios.compiledTokens, 'tracks codegen token-reduction work')}
        </div>
      </div></div>`
    : ''

  const compilerCard = topFiles.length
    ? `<div class="card"><div class="card-h">Track B — Compiler transpile <span class="trailing">median ms</span></div><div class="card-b">
        ${horizBarSvg(topFiles.map((f) => ({ label: path.basename(f.file), value: +f.totalMs.toFixed(2), suffix: ' ms' })), { color: AXON_COLOR })}
        <div class="cap">Median milliseconds per file · warmup 5, 30 iterations</div>
      </div></div>`
    : ''

  const correctnessCard = a
    ? `<div class="card"><div class="card-h">Track A — Correctness</div><div class="card-b">
        <div class="usage"><div class="usage-bar"><div style="width:${passPct}%;background:${TS_COLOR}"></div><div style="width:${100 - passPct}%;background:#ef4444"></div></div>
        <div class="usage-labels"><span>${passPct}% passed</span><span>${passed} / ${total} assertions</span></div></div>
        <div class="cap">Inline @test assertions · adversarial probes ${advOk}/${advTotal} as documented</div>
      </div></div>`
    : ''

  const statCards = [
    a ? { label: 'Correctness @tests', value: `${passed}/${total}`, sub: `${passPct}% pass`, tone: passPct >= 90 ? 'ok' : 'warn' } : null,
    rpg ? { label: 'Transpile rpg.axn', value: fmtMs(rpg.totalMs), sub: `${rpg.lines} lines · ${b.scalingVerdict || ''}`, tone: 'ok' } : null,
    overhead != null ? { label: 'Runtime overhead', value: `${overhead.toFixed(2)}×`, sub: 'dungeon vs hand-written JS', tone: overhead <= 1.15 ? 'ok' : 'warn' } : null,
    agg ? { label: 'Output tokens (Axon/TS)', value: `${agg.ratios.outputTokens.toFixed(2)}×`, sub: 'full source incl. metadata', tone: 'bad' } : null,
  ].filter(Boolean)

  const cStats = [
    guardPct != null ? { label: 'where-guard overhead', value: `${guardPct >= 0 ? '+' : ''}${guardPct.toFixed(0)}%`, sub: 'two constrained params', tone: 'ok' } : null,
    memoSpeedup != null ? { label: '@memo cached speedup', value: `${(memoSpeedup / 1000).toFixed(0)}k×`, sub: 'repeat vs cold call', tone: 'ok' } : null,
    srcRatio != null ? { label: 'controls.axn source size', value: `${srcRatio.toFixed(2)}×`, sub: 'vs controls.ts twin', tone: 'warn' } : null,
  ].filter(Boolean)

  const statCard = (s) => `<div class="stat ${s.tone}"><div class="stat-l">${esc(s.label)}</div><div class="stat-v">${esc(s.value)}</div>${s.sub ? `<div class="stat-s">${esc(s.sub)}</div>` : ''}</div>`

  const strengths = verdict.strengths.map((s) => `<li>${esc(s)}</li>`).join('')
  const risks = verdict.risks.map((r) => `<li>${esc(r)}</li>`).join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Axon Benchmark Report</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0b0e14; color: #e5e7eb; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 32px 24px 64px; }
  h1 { font-size: 26px; margin: 0; display: inline-block; }
  h2 { font-size: 18px; margin: 32px 0 12px; }
  h3 { font-size: 15px; margin: 0 0 8px; }
  .pill { display: inline-block; margin-left: 10px; padding: 2px 10px; border-radius: 999px; background: #1e2a44; color: #93c5fd; font-size: 12px; vertical-align: middle; }
  .muted { color: #9ca3af; font-size: 12px; }
  .sub { color: #b6bdc9; }
  .callout { margin: 20px 0; padding: 14px 16px; border-radius: 10px; background: #10233d; border: 1px solid #1d3a5f; }
  .callout strong { color: #bfdbfe; }
  .grid { display: grid; gap: 12px; }
  .g4 { grid-template-columns: repeat(4, 1fr); }
  .g3 { grid-template-columns: repeat(3, 1fr); }
  .g2 { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 760px) { .g4, .g3, .g2 { grid-template-columns: 1fr 1fr; } }
  .stat { background: #111725; border: 1px solid #1f2937; border-radius: 10px; padding: 14px; }
  .stat-l { color: #9ca3af; font-size: 12px; }
  .stat-v { font-size: 22px; font-weight: 600; margin-top: 4px; }
  .stat-s { color: #6b7280; font-size: 11px; margin-top: 2px; }
  .stat.ok .stat-v { color: #4ade80; } .stat.bad .stat-v { color: #f87171; } .stat.warn .stat-v { color: #fbbf24; }
  .card { background: #111725; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
  .card-h { padding: 12px 16px; border-bottom: 1px solid #1f2937; font-weight: 600; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
  .card-h .trailing { color: #6b7280; font-weight: 400; font-size: 11px; }
  .card-b { padding: 16px; }
  .cap { color: #6b7280; font-size: 11px; margin-top: 8px; }
  .legend { display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: #9ca3af; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
  .ratio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  @media (max-width: 620px) { .ratio-grid { grid-template-columns: 1fr; } }
  .ratio-head { display: flex; justify-content: space-between; font-size: 13px; color: #b6bdc9; margin-bottom: 6px; }
  .ratio-head strong.bad { color: #f87171; } .ratio-head strong.ok { color: #9ca3af; }
  .ratio-track { height: 8px; background: #1f2937; border-radius: 4px; overflow: hidden; }
  .ratio-fill { height: 100%; border-radius: 4px; }
  .ratio-fill.bad { background: ${AXON_COLOR}; } .ratio-fill.ok { background: #4b5563; }
  .ratio-note { color: #6b7280; font-size: 11px; margin-top: 4px; }
  .usage-bar { display: flex; height: 12px; border-radius: 6px; overflow: hidden; }
  .usage-labels { display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; margin-top: 6px; }
  ul { margin: 8px 0 0; padding-left: 18px; } li { margin: 4px 0; color: #cbd5e1; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 760px) { .cols { grid-template-columns: 1fr; } }
  .foot { margin-top: 40px; color: #6b7280; font-size: 12px; }
  code { background: #0f1420; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
</style></head>
<body><div class="wrap">
  <div><h1>Axon Benchmark</h1><span class="pill">${esc((a && a.node) || '')} build</span></div>
  <p class="sub">Four-track evaluation: correctness, compiler speed, runtime overhead, and AI token/cost economy.</p>
  <p class="muted">Source: benchmark/results/*.json · ${esc(genTs)} · ${esc(env)}</p>

  <div class="callout"><strong>${esc(verdict.recommendationLabel)}</strong> — score ${verdict.score}/${verdict.maxScore}.</div>

  <div class="grid g4">${statCards.map(statCard).join('')}</div>

  <h2>Track D — Token &amp; cost economy</h2>
  <div class="grid g2">${tokenChart}${costChart}</div>
  <div style="margin-top:12px">${ratios}</div>

  <h2>Tracks A · B · C</h2>
  <div class="cols">${correctnessCard}${compilerCard}</div>
  <div class="grid g3" style="margin-top:12px">${cStats.map(statCard).join('')}</div>

  <h2>Verdict detail</h2>
  <div class="cols">
    <div class="card"><div class="card-h">Strengths</div><div class="card-b"><ul>${strengths}</ul></div></div>
    <div class="card"><div class="card-h">Risks &amp; limitations</div><div class="card-b"><ul>${risks}</ul></div></div>
  </div>

  <div class="foot">Reproduce: <code>./benchmark/run-docker.sh</code> or <code>node benchmark/run-all.js</code>. This file is regenerated on every run.</div>
</div></body></html>`
}

function main() {
  const a = readTrack('track-a-correctness')
  const b = readTrack('track-b-compiler-perf')
  const c = readTrack('track-c-runtime-perf')
  const d = readTrack('track-d-ai-native')
  const dLive = readTrack('track-d-live')
  const dStaticOnly = readTrack('track-d-static')

  if (d && dLive && !d.live) d.live = dLive

  // Prefer track-d-ai-native static aggregate; fall back to track-d-static when
  // compiled-output tokens were omitted (e.g. Docker missing demo/axon.stdlib.js).
  if (d && d.static && d.static.aggregate && dStaticOnly && dStaticOnly.aggregate) {
    const agg = d.static.aggregate
    const fallback = dStaticOnly.aggregate
    if (agg.ratios.compiledTokens == null && fallback.ratios.compiledTokens != null) {
      agg.ratios.compiledTokens = fallback.ratios.compiledTokens
      agg.axonCompiledTokens = fallback.axonCompiledTokens
      agg.tsCompiledTokens = fallback.tsCompiledTokens
    }
  }

  const missing = ['track-a-correctness', 'track-b-compiler-perf', 'track-c-runtime-perf', 'track-d-ai-native'].filter(
    (n) => !readTrack(n)
  )
  if (missing.length) {
    console.warn('Missing result files (run those tracks first):', missing.join(', '))
  }

  const verdict = verdictFromTracks(a, b, c, d)
  const markdown = renderMarkdown({ a, b, c, d }, verdict)

  fs.mkdirSync(RESULTS, { recursive: true })
  const mdFile = path.join(RESULTS, 'report.md')
  const jsonFile = path.join(RESULTS, 'report.json')
  const htmlFile = path.join(RESULTS, 'report.html')
  fs.writeFileSync(mdFile, markdown, 'utf8')
  fs.writeFileSync(
    jsonFile,
    JSON.stringify({ generatedAt: new Date().toISOString(), verdict, tracksPresent: { a: !!a, b: !!b, c: !!c, d: !!d } }, null, 2) + '\n',
    'utf8'
  )
  fs.writeFileSync(htmlFile, renderHtml({ a, b, c, d }, verdict), 'utf8')

  console.log(markdown)
  console.log(`\nReport written to:`)
  console.log(`  ${path.relative(REPO, mdFile)}`)
  console.log(`  ${path.relative(REPO, jsonFile)}`)
  console.log(`  ${path.relative(REPO, htmlFile)}  ← open in any browser`)
}

main()
