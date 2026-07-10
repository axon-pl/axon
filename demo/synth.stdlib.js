// synth.stdlib.js — Synth standard library (prebuilt, load once)
// All functions are prefixed $ to keep generated output compact.
// Load this before any compiled Synth output when using emitStdlib: false.

const $map = (xs, fn) => xs.map(fn);
const $filter = (xs, pred) => xs.filter(pred);
const $fold = (xs, init, fn) => xs.reduce(fn, init);
const $pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const $zip = (xs, ys) => xs.map((x, i) => [x, ys[i]]);
const $range = (start, end) => Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
const $first = (xs) => xs[0];
const $last = (xs) => xs[xs.length - 1];
const $sum = (xs) => xs.reduce((a, b) => a + b, 0);
const $count = (xs, pred) => pred ? xs.filter(pred).length : xs.length;
const $any = (xs, pred) => xs.some(pred);
const $all = (xs, pred) => xs.every(pred);
const $flat = (xs) => xs.flat();
const $groupBy = (xs, keyFn) => xs.reduce((m, x) => { const k = keyFn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); return m; }, new Map());
const $pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
const $omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const $sort_by = (xs, keyFn) => [...xs].sort((a, b) => { const ka = keyFn(a), kb = keyFn(b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
const $sort_by_desc = (xs, keyFn) => [...xs].sort((a, b) => { const ka = keyFn(a), kb = keyFn(b); return ka > kb ? -1 : ka < kb ? 1 : 0; });
const $trim = (s) => s.trim();
const $split = (s, sep) => s.split(sep);
const $starts_with = (s, prefix) => s.startsWith(prefix);
const $ends_with = (s, suffix) => s.endsWith(suffix);
const $contains = (s, sub) => s.includes(sub);
const $to_upper = (s) => s.toUpperCase();
const $to_lower = (s) => s.toLowerCase();
const $replace_all = (s, from, to) => s.replaceAll(from, to);
const $pad_start = (s, len, padChar = ' ') => s.padStart(len, padChar);
const $pad_end = (s, len, padChar = ' ') => s.padEnd(len, padChar);
const $min = (xs) => xs.reduce((a, b) => a < b ? a : b);
const $max = (xs) => xs.reduce((a, b) => a > b ? a : b);
const $min_by = (xs, keyFn) => xs.reduce((a, b) => keyFn(a) <= keyFn(b) ? a : b);
const $max_by = (xs, keyFn) => xs.reduce((a, b) => keyFn(a) >= keyFn(b) ? a : b);
const $take = (xs, n) => xs.slice(0, n);
const $drop = (xs, n) => xs.slice(n);
const $uniq = (xs) => [...new Set(xs)];
const $chunk = (xs, n) => { const out = []; for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n)); return out; };
const $flat_map = (xs, fn) => xs.flatMap(fn);
const $set_at = (xs, i, val) => [...xs.slice(0, i), val, ...xs.slice(i + 1)];
const $reverse = (xs) => [...xs].reverse();
const $sum_by = (xs, keyFn) => xs.reduce((acc, x) => acc + keyFn(x), 0);
const $clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const $abs = (x) => Math.abs(x);
const $round = (x) => Math.round(x);
const $floor = (x) => Math.floor(x);
const $ceil = (x) => Math.ceil(x);
const $pow = (x, exp) => Math.pow(x, exp);
const $sqrt = (x) => Math.sqrt(x);
const $random = () => Math.random();
const $random_int = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const __synth_presets = {
  email:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url:     /^https?:\/\//,
  uuid:    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alpha:   /^[a-zA-Z]+$/,
  alnum:   /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  slug:    /^[a-z0-9-]+$/,
  hex:     /^#?[0-9a-fA-F]{3,8}$/,
};
const $find = (xs, pred) => xs.find(pred);
const $find_index = (xs, pred) => xs.findIndex(pred);
const $parse_int = (s, radix = 10) => { const n = parseInt(s, radix); return isNaN(n) ? null : n; };
const $parse_float = (s) => { const n = parseFloat(s); return isNaN(n) ? null : n; };
const $ok = (value) => ({ tag: 'Ok', value });
const $err = (message) => ({ tag: 'Err', message });
const $is_ok = (r) => r != null && r.tag === 'Ok';
const $is_err = (r) => r != null && r.tag === 'Err';
const $unwrap = (r) => { if (r != null && r.tag === 'Ok') return r.value; throw new Error(r != null ? r.message : 'unwrap called on null'); };
const $unwrap_or = (r, fallback) => (r != null && r.tag === 'Ok') ? r.value : fallback;
const $delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const $println = (...args) => { console.log(...args); console.log(''); };

// ── likely / embedding host API (v1.1) ───────────────────────────────────────
// Hosts may plug in a real embedder:
//   globalThis.__synth_embed = (text) => Float32Array | number[]
// Without a host embedder, a tiny hashed bag-of-words vector is used so demos
// work offline. Similarity is cosine; $likely_best returns the best claim index
// above `threshold`, or -1.

const __synth_default_embed = (text) => {
  const s = String(text ?? '').toLowerCase();
  const dim = 64;
  const v = new Float32Array(dim);
  const toks = s.split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of toks) {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    v[(h >>> 0) % dim] += 1;
    if (t.length >= 3) {
      for (let i = 0; i < t.length - 2; i++) {
        const tri = t.slice(i, i + 3);
        let th = 2166136261;
        for (let j = 0; j < tri.length; j++) {
          th ^= tri.charCodeAt(j);
          th = Math.imul(th, 16777619);
        }
        v[(th >>> 0) % dim] += 0.5;
      }
    }
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) v[i] /= norm;
  return v;
};

const $embed = (text) => {
  const host = (typeof globalThis !== 'undefined') ? globalThis.__synth_embed : null;
  if (typeof host === 'function') return host(String(text ?? ''));
  return __synth_default_embed(text);
};

const $cosine = (a, b) => {
  if (!a || !b) return 0;
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] || 0, y = b[i] || 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d > 0 ? dot / d : 0;
};

const $likely_best = (subject, claims, threshold = 0.28) => {
  const sv = $embed(subject);
  let best = -1, bestScore = threshold;
  for (let i = 0; i < claims.length; i++) {
    const score = $cosine(sv, $embed(claims[i]));
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
};

/** Score every claim against subject. best is -1 when nothing beats threshold. */
const $score_claims = (subject, claims, threshold = 0.28) => {
  const sv = $embed(subject);
  const scores = [];
  let best = -1, bestScore = threshold;
  for (let i = 0; i < claims.length; i++) {
    const score = $cosine(sv, $embed(claims[i]));
    scores.push(score);
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return { scores, best, bestScore: best < 0 ? 0 : bestScore };
};

if (typeof globalThis !== 'undefined') {
  globalThis.SynthRuntime = globalThis.SynthRuntime || {};
  globalThis.SynthRuntime.embed = $embed;
  globalThis.SynthRuntime.likelyBest = $likely_best;
  globalThis.SynthRuntime.scoreClaims = $score_claims;
  globalThis.SynthRuntime.setEmbed = (fn) => { globalThis.__synth_embed = fn; };
}

const __synth_tests = [];
const __runSynthTests = () => {
  let passed = 0, failed = 0;
  const results = [];
  for (const t of __synth_tests) {
    try {
      const isOk = !!t.fn();
      if (isOk) { passed++; results.push({ ok: true, desc: t.desc }); }
      else { failed++; results.push({ ok: false, desc: t.desc, error: 'assertion returned false' }); }
    } catch(e) { failed++; results.push({ ok: false, desc: t.desc, error: String(e) }); }
  }
  return { passed, failed, total: passed + failed, results };
};
if (typeof globalThis !== 'undefined') { globalThis.__synth_tests = __synth_tests; globalThis.__runSynthTests = __runSynthTests; }
