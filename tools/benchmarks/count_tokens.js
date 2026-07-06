// Token efficiency benchmark — Axon vs TypeScript vs Python
// Uses GPT-4 tokenizer (cl100k_base) — the standard for measuring LLM context usage.

const { encode } = require('gpt-tokenizer');
const fs = require('fs');
const path = require('path');

const dir = __dirname;

const benchmarks = [
  { name: 'Data Pipeline',    files: ['bench_pipeline.axn', 'bench_pipeline.ts', 'bench_pipeline.py'] },
  { name: 'Pattern Matching', files: ['bench_pattern.axn',  'bench_pattern.ts',  'bench_pattern.py']  },
  { name: 'Error Handling',   files: ['bench_error.axn',    'bench_error.ts',    'bench_error.py']    },
];

const langs = ['Axon', 'TypeScript', 'Python'];

console.log('Token Efficiency Benchmark (GPT-4 cl100k_base tokenizer)\n');
console.log('Methodology: token count of equivalent programs solving the same task.');
console.log('Comments and blank lines included — they consume context too.\n');

const results = {};

for (const bench of benchmarks) {
  console.log(`── ${bench.name} ─────────────────────────────────────────────`);
  const counts = {};
  for (let i = 0; i < bench.files.length; i++) {
    const src = fs.readFileSync(path.join(dir, bench.files[i]), 'utf8');
    const tokens = encode(src).length;
    const lines  = src.split('\n').filter(l => l.trim()).length;
    counts[langs[i]] = { tokens, lines };
    console.log(`  ${langs[i].padEnd(12)} ${String(tokens).padStart(4)} tokens   ${String(lines).padStart(3)} lines`);
  }

  const axonTokens = counts['Axon'].tokens;
  const tsTokens   = counts['TypeScript'].tokens;
  const pyTokens   = counts['Python'].tokens;

  const vsTsSaving  = Math.round((1 - axonTokens / tsTokens)  * 100);
  const vsPySaving  = Math.round((1 - axonTokens / pyTokens)  * 100);

  console.log(`  → ${vsTsSaving}% fewer tokens than TypeScript`);
  console.log(`  → ${vsPySaving >= 0 ? vsPySaving + '% fewer' : Math.abs(vsPySaving) + '% more'} tokens than Python`);
  console.log('');

  results[bench.name] = { counts, vsTsSaving, vsPySaving };
}

// Overall averages
const avgVsTs = Math.round(
  Object.values(results).reduce((s, r) => s + r.vsTsSaving, 0) / benchmarks.length
);
const avgVsPy = Math.round(
  Object.values(results).reduce((s, r) => s + r.vsPySaving, 0) / benchmarks.length
);

console.log('══════════════════════════════════════════════════════════════');
console.log(`AVERAGES across ${benchmarks.length} benchmarks:`);
console.log(`  Axon vs TypeScript: ${avgVsTs}% fewer tokens`);
console.log(`  Axon vs Python:     ${avgVsPy >= 0 ? avgVsPy + '% fewer' : Math.abs(avgVsPy) + '% more'} tokens`);
console.log('');
console.log('JSON (for landing page):');
console.log(JSON.stringify({ results, avgVsTs, avgVsPy }, null, 2));
