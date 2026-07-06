// synth.stdlib.js — Synth standard library (prebuilt, load once)
// All functions are prefixed synth_* to avoid collisions with user code.
// Load this before any compiled Synth output when using emitStdlib: false.

const synth_map = (xs, fn) => xs.map(fn);
const synth_filter = (xs, pred) => xs.filter(pred);
const synth_fold = (xs, init, fn) => xs.reduce(fn, init);
const synth_pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const synth_zip = (xs, ys) => xs.map((x, i) => [x, ys[i]]);
const synth_range = (start, end) => Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
const synth_first = (xs) => xs[0];
const synth_last = (xs) => xs[xs.length - 1];
const synth_sum = (xs) => xs.reduce((a, b) => a + b, 0);
const synth_count = (xs, pred) => pred ? xs.filter(pred).length : xs.length;
const synth_any = (xs, pred) => xs.some(pred);
const synth_all = (xs, pred) => xs.every(pred);
const synth_flat = (xs) => xs.flat();
const synth_groupBy = (xs, keyFn) => xs.reduce((m, x) => { const k = keyFn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); return m; }, new Map());
const synth_pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
const synth_omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const synth_sort_by = (xs, keyFn) => [...xs].sort((a, b) => { const ka = keyFn(a), kb = keyFn(b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
const synth_sort_by_desc = (xs, keyFn) => [...xs].sort((a, b) => { const ka = keyFn(a), kb = keyFn(b); return ka > kb ? -1 : ka < kb ? 1 : 0; });
const synth_trim = (s) => s.trim();
const synth_split = (s, sep) => s.split(sep);
const synth_starts_with = (s, prefix) => s.startsWith(prefix);
const synth_ends_with = (s, suffix) => s.endsWith(suffix);
const synth_contains = (s, sub) => s.includes(sub);
const synth_to_upper = (s) => s.toUpperCase();
const synth_to_lower = (s) => s.toLowerCase();
const synth_replace_all = (s, from, to) => s.replaceAll(from, to);
const synth_pad_start = (s, len, padChar = ' ') => s.padStart(len, padChar);
const synth_pad_end = (s, len, padChar = ' ') => s.padEnd(len, padChar);
const synth_min = (xs) => xs.reduce((a, b) => a < b ? a : b);
const synth_max = (xs) => xs.reduce((a, b) => a > b ? a : b);
const synth_min_by = (xs, keyFn) => xs.reduce((a, b) => keyFn(a) <= keyFn(b) ? a : b);
const synth_max_by = (xs, keyFn) => xs.reduce((a, b) => keyFn(a) >= keyFn(b) ? a : b);
const synth_take = (xs, n) => xs.slice(0, n);
const synth_drop = (xs, n) => xs.slice(n);
const synth_uniq = (xs) => [...new Set(xs)];
const synth_chunk = (xs, n) => { const out = []; for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n)); return out; };
const synth_flat_map = (xs, fn) => xs.flatMap(fn);
const synth_set_at = (xs, i, val) => [...xs.slice(0, i), val, ...xs.slice(i + 1)];
const synth_reverse = (xs) => [...xs].reverse();
const synth_sum_by = (xs, keyFn) => xs.reduce((acc, x) => acc + keyFn(x), 0);
const synth_clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const synth_abs = (x) => Math.abs(x);
const synth_round = (x) => Math.round(x);
const synth_floor = (x) => Math.floor(x);
const synth_ceil = (x) => Math.ceil(x);
const synth_pow = (x, exp) => Math.pow(x, exp);
const synth_sqrt = (x) => Math.sqrt(x);
const synth_random = () => Math.random();
const synth_random_int = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
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
const synth_ok = (value) => ({ tag: 'Ok', value });
const synth_err = (message) => ({ tag: 'Err', message });
const synth_is_ok = (r) => r != null && r.tag === 'Ok';
const synth_is_err = (r) => r != null && r.tag === 'Err';
const synth_unwrap = (r) => { if (r != null && r.tag === 'Ok') return r.value; throw new Error(r != null ? r.message : 'unwrap called on null'); };
const synth_unwrap_or = (r, fallback) => (r != null && r.tag === 'Ok') ? r.value : fallback;
const synth_delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const synth_println = (...args) => { console.log(...args); console.log(''); };
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
