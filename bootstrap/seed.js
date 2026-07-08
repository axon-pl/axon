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



// ─── token.syn ─────────────────────────────────────────

const Token = (type, value, line, col) => ({ type, value, line, col });

/**
 * @param {string} name
 * @returns {string}
 */
const keyword_type = (name) => ((_m) => (_m === "type") ? "KW_TYPE" : (_m === "fn") ? "KW_FN" : (_m === "record") ? "KW_RECORD" : (_m === "module") ? "KW_MODULE" : (_m === "match") ? "KW_MATCH" : (_m === "let") ? "KW_LET" : (_m === "where") ? "KW_WHERE" : (_m === "true") ? "KW_TRUE" : (_m === "false") ? "KW_FALSE" : (_m === "if") ? "KW_IF" : (_m === "else") ? "KW_ELSE" : (_m === "return") ? "KW_RETURN" : (_m === "typeof") ? "KW_TYPEOF" : (_m === "instanceof") ? "KW_INSTANCEOF" : (_m === "new") ? "KW_NEW" : (_m === "when") ? "KW_WHEN" : (_m === "as") ? "KW_AS" : (_m === "import") ? "KW_IMPORT" : (_m === "export") ? "KW_EXPORT" : (_m === "from") ? "KW_FROM" : (_m === "for") ? "KW_FOR" : (_m === "in") ? "KW_IN" : (_m === "break") ? "KW_BREAK" : (_m === "continue") ? "KW_CONTINUE" : (_m === "while") ? "KW_WHILE" : (_m === "mut") ? "KW_MUT" : (_m === "refine") ? "KW_REFINE" : (_m === "interface") ? "KW_INTERFACE" : (_m === "infer") ? "KW_INFER" : (_m === "async") ? "KW_ASYNC" : (_m === "await") ? "KW_AWAIT" : (_m === "enum") ? "KW_ENUM" : (_m === "do") ? "KW_DO" : (_m === "and") ? "AND" : (_m === "or") ? "OR" : (_m === "not") ? "BANG" : "")(name);

/**
 * @param {string} ch
 * @returns {string}
 */
const single_char_token = (ch) => ((_m) => (_m === "=") ? "ASSIGN" : (_m === "+") ? "PLUS" : (_m === "-") ? "MINUS" : (_m === "*") ? "STAR" : (_m === "/") ? "SLASH" : (_m === "%") ? "PERCENT" : (_m === "<") ? "LT" : (_m === ">") ? "GT" : (_m === "!") ? "BANG" : (_m === "|") ? "PIPE" : (_m === ".") ? "DOT" : (_m === "?") ? "QUESTION" : (_m === "(") ? "LPAREN" : (_m === ")") ? "RPAREN" : (_m === "[") ? "LBRACKET" : (_m === "]") ? "RBRACKET" : (_m === "{") ? "LBRACE" : (_m === "}") ? "RBRACE" : (_m === ",") ? "COMMA" : (_m === ":") ? "COLON" : (_m === ";") ? "SEMICOLON" : (_m === "_") ? "UNDERSCORE" : "")(ch);



// ─── lexer.syn ─────────────────────────────────────────


/**
 * @returns {string}
 */
const nl_char = () => String.fromCharCode(10);

/**
 * @returns {string}
 */
const cr_char = () => String.fromCharCode(13);

/**
 * @returns {string}
 */
const tab_char = () => String.fromCharCode(9);

/**
 * @returns {string}
 */
const bs_char = () => String.fromCharCode(92);

/**
 * @returns {string}
 */
const dq_char = () => String.fromCharCode(34);

/**
 * @returns {string}
 */
const sq_char = () => String.fromCharCode(39);

const LexState = (src, pos, line, col) => ({ src, pos, line, col });

const LexStr = (st, value) => ({ st, value });

const LexEmit = (st, tokens) => ({ st, tokens });

/**
 * @param {string} s
 * @param {number} i
 * @returns {string}
 */
const char_at = (s, i) => {
  if (i < 0 || i >= s.length) {
    return "";
  } else {
    return s[i];
  }
};

/**
 * @param {LexState} st
 * @returns {LexState}
 */
const lx_advance = (st) => {
  let ch = char_at(st.src, st.pos);
  if (ch == nl_char()) {
    return LexState(st.src, st.pos + 1, st.line + 1, 1);
  } else {
    return LexState(st.src, st.pos + 1, st.line, st.col + 1);
  }
};

/**
 * @param {LexState} st
 * @param {Token} tokens
 * @param {string} tok_type
 * @param {string} value
 * @param {number} len
 * @returns {LexEmit}
 */
const lx_emit = (st, tokens, tok_type, value, len) => {
  let t = Token(tok_type, value, st.line, st.col);
  let s = st;
  let i = 0;
  while (i < len) {
    s = lx_advance(s);
    i = i + 1;
  }
  return LexEmit(s, tokens.concat([t]));
};

/**
 * @param {string} ch
 * @returns {boolean}
 */
const is_digit = (ch) => ch >= "0" && ch <= "9";

/**
 * @param {string} ch
 * @returns {boolean}
 */
const is_ident_start = (ch) => ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch == "_" || ch == "$";

/**
 * @param {string} ch
 * @returns {boolean}
 */
const is_ident_continue = (ch) => is_ident_start(ch) || is_digit(ch);

/**
 * @param {string} ch
 * @returns {boolean}
 */
const is_hex_digit = (ch) => is_digit(ch) || ch >= "a" && ch <= "f" || ch >= "A" && ch <= "F" || ch == "_";

/**
 * @param {string} ch
 * @returns {boolean}
 */
const is_bin_digit = (ch) => ch >= "0" && ch <= "1" || ch == "_";

/**
 * @param {string} ch
 * @returns {boolean}
 */
const is_regex_flag = (ch) => ch == "g" || ch == "i" || ch == "m" || ch == "s" || ch == "u" || ch == "y";

/**
 * @param {Token} tokens
 * @returns {boolean}
 */
const is_regex_start = (tokens) => {
  if (tokens.length == 0) {
    return true;
  } else {
    let t = tokens[tokens.length - 1].type;
    if (t == "IDENT") {
      return false;
    } else if (t == "NUMBER") {
      return false;
    } else if (t == "RPAREN") {
      return false;
    } else if (t == "RBRACKET") {
      return false;
    } else {
      return true;
    }
  }
};

/**
 * @param {LexState} st
 * @returns {LexState}
 */
const lx_skip_ws = (st) => {
  let s = st;
  let done = false;
  while (s.pos < s.src.length && !done) {
    let ch = char_at(s.src, s.pos);
    if (ch == " " || ch == cr_char() || ch == tab_char()) {
      s = lx_advance(s);
    } else if (ch == "/" && char_at(s.src, s.pos + 1) == "/") {
      while (s.pos < s.src.length && char_at(s.src, s.pos) != nl_char()) {
        s = lx_advance(s);
      }
    } else {
      done = true;
    }
  }
  return s;
};

/**
 * @param {LexState} st
 * @returns {LexStr}
 */
const lx_read_ident_raw = (st) => {
  let s = st;
  let name = "";
  while (s.pos < s.src.length && is_ident_continue(char_at(s.src, s.pos))) {
    name = name + char_at(s.src, s.pos);
    s = lx_advance(s);
  }
  return LexStr(s, name);
};

/**
 * @param {string} esc
 * @returns {string}
 */
const lx_escape_char = (esc) => {
  if (esc == "n") {
    return nl_char();
  } else if (esc == "t") {
    return tab_char();
  } else if (esc == "r") {
    return cr_char();
  } else if (esc == bs_char()) {
    return bs_char();
  } else if (esc == "'") {
    return sq_char();
  } else if (esc == dq_char()) {
    return dq_char();
  } else {
    return bs_char() + esc;
  }
};

/**
 * @param {LexState} st
 * @param {Token} tokens
 * @returns {LexEmit}
 */
const lx_read_triple_quote = (st, tokens) => {
  let start_line = st.line;
  let start_col = st.col;
  let s = st;
  s = lx_advance(s);
  s = lx_advance(s);
  s = lx_advance(s);
  let value = "";
  let done = false;
  while (s.pos < s.src.length && !done) {
    if (char_at(s.src, s.pos) == "\"" && char_at(s.src, s.pos + 1) == "\"" && char_at(s.src, s.pos + 2) == "\"") {
      s = lx_advance(s);
      s = lx_advance(s);
      s = lx_advance(s);
      done = true;
    } else {
      let ch = char_at(s.src, s.pos);
      if (ch == nl_char()) {
        value = value + nl_char();
        s = LexState(s.src, s.pos + 1, s.line + 1, 1);
      } else {
        value = value + ch;
        s = lx_advance(s);
      }
    }
  }
  let v = (() => {
    if (value.length > 0 && char_at(value, 0) == nl_char()) {
      return value.slice(1);
    } else {
      return value;
    }
})();
  return LexEmit(s, tokens.concat([Token("STRING", v, start_line, start_col)]));
};

/**
 * @param {LexState} st
 * @param {Token} tokens
 * @param {string} quote
 * @returns {LexEmit}
 */
const lx_read_string = (st, tokens, quote) => {
  let start_col = st.col;
  let s = st;
  s = lx_advance(s);
  let value = "";
  while (s.pos < s.src.length && char_at(s.src, s.pos) != quote) {
    if (char_at(s.src, s.pos) == bs_char()) {
      s = lx_advance(s);
      let esc = char_at(s.src, s.pos);
      value = value + lx_escape_char(esc);
      s = lx_advance(s);
    } else {
      value = value + char_at(s.src, s.pos);
      s = lx_advance(s);
    }
  }
  s = lx_advance(s);
  return LexEmit(s, tokens.concat([Token("STRING", value, s.line, start_col)]));
};

/**
 * @param {LexState} st
 * @param {Token} tokens
 * @returns {LexEmit}
 */
const lx_read_template = (st, tokens) => {
  let start_col = st.col;
  let s = st;
  let raw = "`";
  s = lx_advance(s);
  let brace_depth = 0;
  while (s.pos < s.src.length) {
    let ch = char_at(s.src, s.pos);
    if (ch == "`" && brace_depth == 0) {
      break;
    }
    raw = raw + ch;
    if (ch == nl_char()) {
      s = LexState(s.src, s.pos + 1, s.line + 1, 1);
    } else {
      s = LexState(s.src, s.pos + 1, s.line, s.col + 1);
    }
    if (ch == "{") {
      brace_depth = brace_depth + 1;
    } else if (ch == "}" && brace_depth > 0) {
      brace_depth = brace_depth - 1;
    }
  }
  raw = raw + "`";
  s = lx_advance(s);
  return LexEmit(s, tokens.concat([Token("TEMPLATE", raw, s.line, start_col)]));
};

/**
 * @param {LexState} st
 * @param {Token} tokens
 * @returns {LexEmit}
 */
const lx_read_regex = (st, tokens) => {
  let start_col = st.col;
  let s = st;
  s = lx_advance(s);
  let pattern = "";
  let in_class = false;
  while (s.pos < s.src.length) {
    let ch = char_at(s.src, s.pos);
    if (ch == "[") {
      in_class = true;
    }
    if (ch == "]") {
      in_class = false;
    }
    if (ch == "/" && !in_class) {
      break;
    }
    if (ch == bs_char()) {
      pattern = pattern + ch;
      s = lx_advance(s);
    }
    pattern = pattern + char_at(s.src, s.pos);
    s = lx_advance(s);
  }
  s = lx_advance(s);
  let flags = "";
  while (s.pos < s.src.length && is_regex_flag(char_at(s.src, s.pos))) {
    flags = flags + char_at(s.src, s.pos);
    s = lx_advance(s);
  }
  return LexEmit(s, tokens.concat([Token("REGEX", "/" + pattern + "/" + flags, s.line, start_col)]));
};

/**
 * @param {LexState} st
 * @param {Token} tokens
 * @returns {LexEmit}
 */
const lx_read_number = (st, tokens) => {
  let start_col = st.col;
  let s = st;
  let raw = "";
  if (char_at(s.src, s.pos) == "0") {
    let next = char_at(s.src, s.pos + 1);
    if (next == "x" || next == "X") {
      raw = raw + char_at(s.src, s.pos);
      s = lx_advance(s);
      raw = raw + char_at(s.src, s.pos);
      s = lx_advance(s);
      while (s.pos < s.src.length && is_hex_digit(char_at(s.src, s.pos))) {
        raw = raw + char_at(s.src, s.pos);
        s = lx_advance(s);
      }
      return LexEmit(s, tokens.concat([Token("NUMBER", raw.replace("_", ""), s.line, start_col)]));
    }
    if (next == "b" || next == "B") {
      raw = raw + char_at(s.src, s.pos);
      s = lx_advance(s);
      raw = raw + char_at(s.src, s.pos);
      s = lx_advance(s);
      while (s.pos < s.src.length && is_bin_digit(char_at(s.src, s.pos))) {
        raw = raw + char_at(s.src, s.pos);
        s = lx_advance(s);
      }
      return LexEmit(s, tokens.concat([Token("NUMBER", raw.replace("_", ""), s.line, start_col)]));
    }
  }
  let looping = true;
  while (s.pos < s.src.length && looping) {
    let ch = char_at(s.src, s.pos);
    if (is_digit(ch) || ch == "_") {
      raw = raw + ch;
      s = lx_advance(s);
    } else if (ch == "." && is_digit(char_at(s.src, s.pos + 1))) {
      raw = raw + ch;
      s = lx_advance(s);
    } else {
      looping = false;
    }
  }
  return LexEmit(s, tokens.concat([Token("NUMBER", raw.replace("_", ""), s.line, start_col)]));
};

/**
 * @param {LexState} st
 * @param {Token} tokens
 * @returns {LexEmit}
 */
const lx_read_ident = (st, tokens) => {
  let start_col = st.col;
  let start_line = st.line;
  let got = lx_read_ident_raw(st);
  let kw = keyword_type(got.value);
  let tok = (() => {
    if (kw != "") {
      return Token(kw, got.value, start_line, start_col);
    } else {
      return Token("IDENT", got.value, start_line, start_col);
    }
})();
  return LexEmit(got.st, tokens.concat([tok]));
};

/**
 * @param {LexState} st
 * @param {Token} tokens
 * @returns {LexEmit}
 */
const lx_try_multi = (st, tokens) => {
  let ch = char_at(st.src, st.pos);
  let three = st.src.slice(st.pos, st.pos + 3);
  let two = st.src.slice(st.pos, st.pos + 2);
  if (three == "===") {
    return lx_emit(st, tokens, "STRICT_EQ", "===", 3);
  } else if (three == "!==") {
    return lx_emit(st, tokens, "STRICT_NEQ", "!==", 3);
  } else if (three == "??=") {
    return lx_emit(st, tokens, "NULL_COALESCE_EQ", "??=", 3);
  } else if (ch == "." && char_at(st.src, st.pos + 1) == "." && char_at(st.src, st.pos + 2) == ".") {
    return lx_emit(st, tokens, "SPREAD", "...", 3);
  } else if (ch == "." && char_at(st.src, st.pos + 1) == "." && char_at(st.src, st.pos + 2) == "=") {
    return lx_emit(st, tokens, "DOTDOTEQ", "..=", 3);
  } else if (two == "|>") {
    return lx_emit(st, tokens, "PIPE_OP", "|>", 2);
  } else if (two == "=>") {
    return lx_emit(st, tokens, "FAT_ARROW", "=>", 2);
  } else if (two == "->") {
    return lx_emit(st, tokens, "THIN_ARROW", "->", 2);
  } else if (two == "::") {
    return lx_emit(st, tokens, "DOUBLE_COLON", "::", 2);
  } else if (two == "==") {
    return lx_emit(st, tokens, "EQ", "==", 2);
  } else if (two == "!=") {
    return lx_emit(st, tokens, "NEQ", "!=", 2);
  } else if (two == "<=") {
    return lx_emit(st, tokens, "LTE", "<=", 2);
  } else if (two == ">=") {
    return lx_emit(st, tokens, "GTE", ">=", 2);
  } else if (two == "&&") {
    return lx_emit(st, tokens, "AND", "&&", 2);
  } else if (two == "||") {
    return lx_emit(st, tokens, "OR", "||", 2);
  } else if (two == "??") {
    return lx_emit(st, tokens, "NULL_COALESCE", "??", 2);
  } else if (two == "?.") {
    return lx_emit(st, tokens, "OPTIONAL_CHAIN", "?.", 2);
  } else if (two == "+=") {
    return lx_emit(st, tokens, "PLUS_EQ", "+=", 2);
  } else if (two == "-=") {
    return lx_emit(st, tokens, "MINUS_EQ", "-=", 2);
  } else if (two == "*=") {
    return lx_emit(st, tokens, "STAR_EQ", "*=", 2);
  } else if (two == "/=") {
    return lx_emit(st, tokens, "SLASH_EQ", "/=", 2);
  } else if (two == "%=") {
    return lx_emit(st, tokens, "PERCENT_EQ", "%=", 2);
  } else if (ch == "." && char_at(st.src, st.pos + 1) == ".") {
    return lx_emit(st, tokens, "DOTDOT", "..", 2);
  } else {
    let single = single_char_token(ch);
    if (single != "") {
      return lx_emit(st, tokens, single, ch, 1);
    } else {
      return LexEmit(lx_advance(st), tokens);
    }
  }
};

/**
 * @param {string} src
 * @returns {Token}
 */
const tokenize = (src) => {
  let st = LexState(src, 0, 1, 1);
  let tokens = [];
  while (st.pos < st.src.length) {
    st = lx_skip_ws(st);
    if (st.pos >= st.src.length) {
      break;
    }
    let ch = char_at(st.src, st.pos);
    if (ch == nl_char()) {
      st = lx_advance(st);
    } else if (ch == "\"" && char_at(st.src, st.pos + 1) == "\"" && char_at(st.src, st.pos + 2) == "\"") {
      let em = lx_read_triple_quote(st, tokens);
      st = em.st;
      tokens = em.tokens;
    } else if (ch == "`") {
      let em = lx_read_template(st, tokens);
      st = em.st;
      tokens = em.tokens;
    } else if (ch == "\"" || ch == "'") {
      let em = lx_read_string(st, tokens, ch);
      st = em.st;
      tokens = em.tokens;
    } else if (ch == "/" && is_regex_start(tokens)) {
      let em = lx_read_regex(st, tokens);
      st = em.st;
      tokens = em.tokens;
    } else if (is_digit(ch) || ch == "." && is_digit(char_at(st.src, st.pos + 1))) {
      let em = lx_read_number(st, tokens);
      st = em.st;
      tokens = em.tokens;
    } else if (is_ident_start(ch)) {
      let em = lx_read_ident(st, tokens);
      st = em.st;
      tokens = em.tokens;
    } else if (ch == "@" || ch == "#") {
      let start_col = st.col;
      let prefix = ch;
      st = lx_advance(st);
      let got = lx_read_ident_raw(st);
      st = got.st;
      tokens = tokens.concat([Token("AT", prefix + got.value, st.line, start_col)]);
    } else {
      let em = lx_try_multi(st, tokens);
      st = em.st;
      tokens = em.tokens;
    }
  }
  return tokens.concat([Token("EOF", "", st.line, st.col)]);
};



// ─── ast.syn ───────────────────────────────────────────

const Program = (kind, body) => ({ kind, body });

const TypeAlias = (kind, name, typeParams, type, constraint, line) => ({ kind, name, typeParams, type, constraint, line });

const InterfaceDecl = (kind, name, typeParams, fields, line) => ({ kind, name, typeParams, fields, line });

const InterfaceField = (name, type) => ({ name, type });

const EnumDecl = (kind, name, variants, line) => ({ kind, name, variants, line });

const TaggedUnionDecl = (kind, name, variants, line) => ({ kind, name, variants, line });

const UnionVariant = (name, fields) => ({ name, fields });

const TestDecl = (kind, description, body, line) => ({ kind, description, body, line });

const ImportDecl = (kind, names, source, line) => ({ kind, names, source, line });

const ExportDecl = (kind, decl, line) => ({ kind, decl, line });

const TopLevelExpr = (kind, expr, line) => ({ kind, expr, line });

const TopLevelLet = (kind, name, value, line) => ({ kind, name, value, line });

const TopLevelStmt = (kind, stmt, line) => ({ kind, stmt, line });

const RecordDecl = (kind, name, typeParams, fields, line) => ({ kind, name, typeParams, fields, line });

const FieldDecl = (name, type) => ({ name, type });

const FnDecl = (kind, name, typeParams, params, returnType, annotations, body, shortForm, isAsync, line) => ({ kind, name, typeParams, params, returnType, annotations, body, shortForm, isAsync, line });

const StoreDecl = (kind, name, fields, line) => ({ kind, name, fields, line });

const StoreField = (name, type, defaultValue) => ({ name, type, defaultValue });

const ModuleDecl = (kind, name, annotations, body, line) => ({ kind, name, annotations, body, line });

const Annotation = (name, value) => ({ name, value });

const FnParam = (name, type, spread) => ({ name, type, spread });

const CompareConstraint = (kind, op, value) => ({ kind, op, value });

const LengthConstraint = (kind, op, value) => ({ kind, op, value });

const MatchesConstraint = (kind, preset) => ({ kind, preset });

const RegexConstraint = (kind, pattern, flags) => ({ kind, pattern, flags });

const AndConstraint = (kind, left, right) => ({ kind, left, right });

const OrConstraint = (kind, left, right) => ({ kind, left, right });

const NotConstraint = (kind, inner) => ({ kind, inner });

const CustomConstraint = (kind, expr) => ({ kind, expr });

const TypeExpr = (name, typeArgs, isArray, isOptional, union, fnParams, fnReturn) => ({ name, typeArgs, isArray, isOptional, union, fnParams, fnReturn });

const NumberLit = (kind, value, raw) => ({ kind, value, raw });

const StringLit = (kind, value, raw) => ({ kind, value, raw });

const TemplateLit = (kind, raw, quasis, exprs) => ({ kind, raw, quasis, exprs });

const BoolLit = (kind, value) => ({ kind, value });

const RegexLit = (kind, pattern, flags) => ({ kind, pattern, flags });

const NullLit = (kind) => ({ kind });

const RawJS = (kind, code) => ({ kind, code });

const Identifier = (kind, name) => ({ kind, name });

const ObjectLit = (kind, properties) => ({ kind, properties });

const ObjectProperty = (kind, key, value, computed, shorthand, spread) => ({ kind, key, value, computed, shorthand, spread });

const ArrayLit = (kind, elements) => ({ kind, elements });

const SpreadExpr = (kind, argument) => ({ kind, argument });

const BinaryExpr = (kind, op, left, right) => ({ kind, op, left, right });

const UnaryExpr = (kind, op, operand, prefix) => ({ kind, op, operand, prefix });

const TernaryExpr = (kind, test, consequent, alternate) => ({ kind, test, consequent, alternate });

const CallExpr = (kind, callee, args, optional) => ({ kind, callee, args, optional });

const NewExpr = (kind, callee, args) => ({ kind, callee, args });

const IndexExpr = (kind, object, index, optional) => ({ kind, object, index, optional });

const MemberExpr = (kind, object, property, optional) => ({ kind, object, property, optional });

const LambdaExpr = (kind, params, body, isAsync) => ({ kind, params, body, isAsync });

const PipeAsStep = (kind, name) => ({ kind, name });

const PipelineExpr = (kind, steps) => ({ kind, steps });

const BlockExpr = (kind, stmts) => ({ kind, stmts });

const DoExpr = (kind, body) => ({ kind, body });

const ResultPropagateExpr = (kind, value) => ({ kind, value });

const AwaitExpr = (kind, value) => ({ kind, value });

const MatchExpr = (kind, subject, arms) => ({ kind, subject, arms });

const MatchArm = (pattern, guard, body) => ({ pattern, guard, body });

const LetStmt = (kind, name, value, mutable, infer) => ({ kind, name, value, mutable, infer });

const DestructureStmt = (kind, style, names, value) => ({ kind, style, names, value });

const ReturnStmt = (kind, value) => ({ kind, value });

const ExprStmt = (kind, value) => ({ kind, value });

const IfStmt = (kind, test, then, else_) => ({ kind, test, then, else_ });

const ForRangeStmt = (kind, varName, lo, hi, inclusive, body) => ({ kind, varName, lo, hi, inclusive, body });

const ForInStmt = (kind, varName, iter, body) => ({ kind, varName, iter, body });

const WhileStmt = (kind, test, body) => ({ kind, test, body });

const BreakStmt = (kind) => ({ kind });

const ContinueStmt = (kind) => ({ kind });

const RefineStmt = (kind, name, claim) => ({ kind, name, claim });

const LiteralPat = (kind, value) => ({ kind, value });

const WildcardPat = (kind) => ({ kind });

const ComparePat = (kind, op, value) => ({ kind, op, value });

const IdentPat = (kind, name) => ({ kind, name });

const TagPat = (kind, name, bindings) => ({ kind, name, bindings });

const EnumPat = (kind, enumName, variant) => ({ kind, enumName, variant });

const Diagnostic = (severity, message, line, col) => ({ severity, message, line, col });

/**
 * @param {*} body
 * @returns {Program}
 */
const program = (body) => Program("Program", body);

/**
 * @param {string} name
 * @param {*} ty
 * @param {number} line
 * @returns {TypeAlias}
 */
const type_alias = (name, ty, line) => TypeAlias("TypeAlias", name, [], ty, null, line);

/**
 * @param {string} name
 * @param {*} params
 * @param {*} return_type
 * @param {*} body
 * @param {number} line
 * @returns {FnDecl}
 */
const fn_decl = (name, params, return_type, body, line) => FnDecl("FnDecl", name, [], params, return_type, [], body, false, false, line);

/**
 * @param {string} name
 * @param {*} fields
 * @param {number} line
 * @returns {RecordDecl}
 */
const record_decl = (name, fields, line) => RecordDecl("RecordDecl", name, [], fields, line);

/**
 * @param {number} value
 * @param {string} raw
 * @returns {NumberLit}
 */
const number_lit = (value, raw) => NumberLit("NumberLit", value, raw);

/**
 * @param {string} value
 * @param {string} raw
 * @returns {StringLit}
 */
const string_lit = (value, raw) => StringLit("StringLit", value, raw);

/**
 * @param {boolean} value
 * @returns {BoolLit}
 */
const bool_lit = (value) => BoolLit("BoolLit", value);

/**
 * @param {string} name
 * @returns {Identifier}
 */
const ident = (name) => Identifier("Identifier", name);

/**
 * @param {*} stmts
 * @returns {BlockExpr}
 */
const block_expr = (stmts) => BlockExpr("BlockExpr", stmts);

/**
 * @param {*} value
 * @returns {ExprStmt}
 */
const expr_stmt = (value) => ExprStmt("ExprStmt", value);

/**
 * @param {*} expr
 * @param {number} line
 * @returns {TopLevelExpr}
 */
const top_level_expr = (expr, line) => TopLevelExpr("TopLevelExpr", expr, line);

/**
 * @param {string} name
 * @returns {TypeExpr}
 */
const type_expr = (name) => TypeExpr(name, [], false, false, [], [], null);

/**
 * @param {string} name
 * @param {*} ty
 * @returns {FieldDecl}
 */
const field_decl = (name, ty) => FieldDecl(name, ty);

/**
 * @param {string} name
 * @param {*} ty
 * @returns {FnParam}
 */
const fn_param = (name, ty) => FnParam(name, ty, false);

/**
 * @param {*} node
 * @returns {string}
 */
const ast_kind = (node) => node.kind;



// ─── parser.syn ────────────────────────────────────────


const ParserState = (tokens, pos, in_match_guard, errors) => ({ tokens, pos, in_match_guard, errors });

const ParseVal = (st, value) => ({ st, value });

/**
 * @param {string} s
 * @param {string} sub
 * @param {number} start
 * @returns {number}
 */
const index_from = (s, sub, start) => {
  let i = start;
  while (i <= s.length - sub.length) {
    if (s.slice(i, i + sub.length) == sub) {
      return i;
    }
    i = i + 1;
  }
  return -1;
};

const RegexParts = (pattern, flags) => ({ pattern, flags });

/**
 * @param {string} raw
 * @returns {RegexParts}
 */
const regex_parts = (raw) => {
  let slash = raw.length - 1;
  while (slash > 0) {
    if (raw[slash] == "/") {
      break;
    }
    slash = slash - 1;
  }
  return RegexParts(raw.slice(1, slash), raw.slice(slash + 1));
};

/**
 * @param {string} s
 * @returns {string}
 */
const escape_js_string = (s) => {
  let out = "\"";
  let i = 0;
  while (i < s.length) {
    let c = s.slice(i, i + 1);
    if (c == "\\") {
      out = out + "\\\\";
    } else if (c == "\"") {
      out = out + "\\\"";
    } else if (c == "\n") {
      out = out + "\\n";
    } else if (c == "\r") {
      out = out + "\\r";
    } else if (c == "\t") {
      out = out + "\\t";
    } else {
      out = out + c;
    }
    i = i + 1;
  }
  return out + "\"";
};

/**
 * @param {string} tok_type
 * @returns {boolean}
 */
const is_kw_type = (tok_type) => tok_type.length >= 4 && tok_type.slice(0, 3) == "KW_";

/**
 * @param {string} parts
 * @param {string} sep
 * @returns {string}
 */
const join_strings = (parts, sep) => {
  let result = "";
  let i = 0;
  while (i < parts.length) {
    if (i > 0) {
      result = result + sep;
    }
    result = result + parts[i];
    i = i + 1;
  }
  return result;
};

/**
 * @param {string} tok_type
 * @param {string} value
 * @returns {boolean}
 */
const is_sync_point = (tok_type, value) => {
  if (tok_type == "KW_FN") {
    return true;
  } else if (tok_type == "KW_TYPE") {
    return true;
  } else if (tok_type == "KW_RECORD") {
    return true;
  } else if (tok_type == "KW_MODULE") {
    return true;
  } else if (tok_type == "KW_IMPORT") {
    return true;
  } else if (tok_type == "KW_EXPORT") {
    return true;
  } else if (tok_type == "KW_LET") {
    return true;
  } else if (tok_type == "KW_INTERFACE") {
    return true;
  } else if (tok_type == "KW_ASYNC") {
    return true;
  } else if (tok_type == "KW_ENUM") {
    return true;
  } else if (tok_type == "EOF") {
    return true;
  } else if (tok_type == "IDENT" && value == "store") {
    return true;
  } else if (tok_type == "IDENT" && value == "on") {
    return true;
  } else {
    return false;
  }
};

/**
 * @param {string} name
 * @param {*} type_args
 * @param {boolean} is_array
 * @param {boolean} is_optional
 * @returns {*}
 */
const mk_type_expr = (name, type_args, is_array, is_optional) => {
  if (name == "fn") {
    return {name: "fn", fnParams: type_args, fnReturn: {name: "any", isArray: false, isOptional: false}};
  } else if (name == "__object__") {
    return {name: "__object__", typeArgs: type_args};
  } else if (type_args.length > 0) {
    return {name: name, typeArgs: type_args, isArray: is_array, isOptional: is_optional};
  } else {
    return {name: name, isArray: is_array, isOptional: is_optional};
  }
};

/**
 * @param {*} fn_params
 * @param {*} fn_return
 * @returns {*}
 */
const mk_fn_type = (fn_params, fn_return) => ({name: "fn", fnParams: fn_params, fnReturn: fn_return});

/**
 * @param {*} pattern
 * @param {*} guard
 * @param {*} body
 * @returns {*}
 */
const mk_match_arm = (pattern, guard, body) => {
  if (guard == null) {
    return {pattern: pattern, body: body};
  } else {
    return {pattern: pattern, guard: guard, body: body};
  }
};

/**
 * @param {string} name
 * @param {*} type_params
 * @param {*} params
 * @param {*} return_type
 * @param {*} annotations
 * @param {*} body
 * @param {boolean} short_form
 * @param {boolean} is_async
 * @param {number} line
 * @returns {*}
 */
const mk_fn_decl = (name, type_params, params, return_type, annotations, body, short_form, is_async, line) => {
  if (is_async) {
    return {kind: "FnDecl", name: name, typeParams: type_params, params: params, returnType: return_type, annotations: annotations, body: body, shortForm: short_form, isAsync: true, line: line};
  } else {
    return {kind: "FnDecl", name: name, typeParams: type_params, params: params, returnType: return_type, annotations: annotations, body: body, shortForm: short_form, line: line};
  }
};

/**
 * @param {*} callee
 * @param {*} args
 * @param {boolean} optional
 * @returns {*}
 */
const mk_call_expr = (callee, args, optional) => {
  if (optional) {
    return {kind: "CallExpr", callee: callee, args: args, optional: true};
  } else {
    return {kind: "CallExpr", callee: callee, args: args};
  }
};

/**
 * @param {*} object
 * @param {string} property
 * @param {boolean} optional
 * @returns {*}
 */
const mk_member_expr = (object, property, optional) => {
  if (optional) {
    return {kind: "MemberExpr", object: object, property: property, optional: true};
  } else {
    return {kind: "MemberExpr", object: object, property: property};
  }
};

/**
 * @param {*} object
 * @param {*} index
 * @param {boolean} optional
 * @returns {*}
 */
const mk_index_expr = (object, index, optional) => {
  if (optional) {
    return {kind: "IndexExpr", object: object, index: index, optional: true};
  } else {
    return {kind: "IndexExpr", object: object, index: index};
  }
};

/**
 * @param {*} test
 * @param {*} then_block
 * @param {*} else_block
 * @returns {*}
 */
const mk_if_stmt = (test, then_block, else_block) => {
  if (else_block == null) {
    return {kind: "IfStmt", test: test, then: then_block};
  } else {
    return {kind: "IfStmt", test: test, then: then_block, else_: else_block};
  }
};

/**
 * @param {*} raw
 * @param {string} fallback_kind
 * @returns {*}
 */
const wrap_block_body = (raw, fallback_kind) => {
  if (raw.kind == "BlockExpr") {
    return raw;
  } else {
    return {kind: "BlockExpr", stmts: [{kind: fallback_kind, value: raw}]};
  }
};

/**
 * @param {ParserState} st
 * @returns {Token}
 */
const ps_peek = (st) => {
  if (st.pos >= st.tokens.length) {
    return Token("EOF", "", 0, 0);
  } else {
    return st.tokens[st.pos];
  }
};

/**
 * @param {ParserState} st
 * @param {number} offset
 * @returns {Token}
 */
const ps_token_at = (st, offset) => {
  let idx = st.pos + offset;
  if (idx < 0 || idx >= st.tokens.length) {
    return Token("EOF", "", 0, 0);
  } else {
    return st.tokens[idx];
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_advance = (st) => {
  let tok = ps_peek(st);
  return ParseVal(ParserState(st.tokens, st.pos + 1, st.in_match_guard, st.errors), tok);
};

/**
 * @param {ParserState} st
 * @param {string} tok_type
 * @returns {boolean}
 */
const ps_check = (st, tok_type) => ps_peek(st).type == tok_type;

/**
 * @param {ParserState} st
 * @returns {boolean}
 */
const ps_is_eof = (st) => ps_peek(st).type == "EOF";

/**
 * @param {ParserState} st
 * @param {string} expected
 * @returns {ParseVal}
 */
const ps_expect = (st, expected) => {
  let tok = ps_peek(st);
  if (tok.type != expected) {
    let err = {severity: "error", message: "Expected " + expected + ", got " + tok.type, line: tok.line, col: tok.col};
    return ParseVal(ParserState(st.tokens, st.pos, st.in_match_guard, st.errors.concat([err])), tok);
  } else {
    return ps_advance(st);
  }
};

/**
 * @param {ParserState} st
 * @param {string} expected
 * @returns {ParseVal}
 */
const ps_try_consume = (st, expected) => {
  if (ps_check(st, expected)) {
    return ps_advance(st);
  } else {
    return ParseVal(st, null);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_expect_ident_or_keyword = (st) => {
  let tok = ps_peek(st);
  if (tok.type == "IDENT" || is_kw_type(tok.type)) {
    return ps_advance(st);
  } else {
    let err = {severity: "error", message: "Expected identifier, got " + tok.type, line: tok.line, col: tok.col};
    return ParseVal(ParserState(st.tokens, st.pos, st.in_match_guard, st.errors.concat([err])), tok);
  }
};

/**
 * @param {ParserState} st
 * @returns {boolean}
 */
const ps_is_double_colon_ahead = (st) => ps_token_at(st, 0).type == "DOUBLE_COLON";

/**
 * @param {ParserState} st
 * @returns {ParserState}
 */
const ps_sync_to_next_top_level = (st) => {
  let s = st;
  let done = false;
  while (!ps_is_eof(s) && !done) {
    let tok = ps_peek(s);
    if (is_sync_point(tok.type, tok.value)) {
      done = true;
    } else {
      s = ps_advance(s).st;
    }
  }
  return s;
};

/**
 * @param {ParserState} st
 * @returns {boolean}
 */
const ps_is_lambda_ahead = (st) => {
  let i = st.pos + 1;
  let depth = 1;
  while (i < st.tokens.length && depth > 0) {
    let tt = st.tokens[i].type;
    if (tt == "LPAREN") {
      depth = depth + 1;
    }
    if (tt == "RPAREN") {
      depth = depth - 1;
    }
    i = i + 1;
  }
  if (i < st.tokens.length) {
    return st.tokens[i].type == "FAT_ARROW";
  } else {
    return false;
  }
};

/**
 * @param {ParserState} st
 * @returns {boolean}
 */
const ps_is_object_lit_ahead = (st) => {
  let t1 = ps_token_at(st, 1);
  if (t1.type == "EOF") {
    return false;
  }
  if (t1.type == "RBRACE") {
    return true;
  }
  if (t1.type == "SPREAD") {
    return true;
  }
  let t2 = ps_token_at(st, 2);
  if (t1.type == "IDENT" && t2.type == "COLON") {
    return true;
  }
  if (t1.type == "STRING" && t2.type == "COLON") {
    return true;
  }
  if (t1.type == "IDENT" && t2.type == "COMMA") {
    return true;
  }
  if (t1.type == "IDENT" && t2.type == "RBRACE") {
    return true;
  }
  return false;
};

/**
 * @param {*} expr
 * @returns {boolean}
 */
const ps_is_assignable = (expr) => {
  if (expr.kind == "Identifier") {
    return true;
  } else if (expr.kind == "MemberExpr") {
    return true;
  } else if (expr.kind == "IndexExpr") {
    return true;
  } else {
    return false;
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse = (st) => {
  let s = st;
  let body = [];
  let done = false;
  while (!ps_is_eof(s) && !done) {
    let got = ps_parse_top_level(s);
    s = got.st;
    if (got.value != null) {
      body = body.concat([got.value]);
    }
  }
  return ParseVal(s, program(body));
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_top_level = (st) => {
  let tok = ps_peek(st);
  if (tok.type == "KW_ENUM") {
    return ps_parse_enum_decl(st);
  }
  if (tok.type == "KW_TYPE") {
    return ps_parse_type_alias_or_union(st);
  }
  if (tok.type == "KW_RECORD") {
    return ps_parse_record(st);
  }
  if (tok.type == "KW_FN") {
    return ps_parse_fn_decl(st, false);
  }
  if (tok.type == "KW_MODULE") {
    return ps_parse_module(st);
  }
  if (tok.type == "KW_INTERFACE") {
    return ps_parse_interface_decl(st);
  }
  if (tok.type == "KW_ASYNC") {
    let adv = ps_advance(st);
    let got = ps_parse_fn_decl(adv.st, true);
    return ParseVal(got.st, got.value);
  } else if (tok.type == "IDENT" && tok.value == "store") {
    let t1 = ps_token_at(st, 1);
    let t2 = ps_token_at(st, 2);
    if (t1.type == "IDENT" && t2.type == "LBRACE") {
      return ps_parse_store_decl(st);
    } else {
      return ps_parse_top_level_expr(st);
    }
  } else if (tok.type == "IDENT" && tok.value == "on") {
    let t1 = ps_token_at(st, 1);
    let t2 = ps_token_at(st, 2);
    if (t1.type == "IDENT" && t2.type == "DOT") {
      let adv = ps_advance(st);
      let got = ps_parse_on_change_expr(adv.st);
      return ParseVal(got.st, {kind: "TopLevelExpr", expr: got.value, line: tok.line});
    } else {
      return ps_parse_top_level_expr(st);
    }
  } else if (tok.type == "AT" && tok.value == "@test") {
    return ps_parse_test_decl(st);
  } else if (tok.type == "KW_IMPORT") {
    return ps_parse_import_decl(st);
  } else if (tok.type == "KW_EXPORT") {
    return ps_parse_export_decl(st);
  } else if (tok.type == "KW_LET") {
    return ps_parse_top_level_let(st);
  } else if (tok.type == "KW_FOR") {
    let got = ps_parse_for_stmt(st);
    return ParseVal(got.st, {kind: "TopLevelStmt", stmt: got.value, line: tok.line});
  } else if (tok.type == "KW_WHILE") {
    let got = ps_parse_while_stmt(st);
    return ParseVal(got.st, {kind: "TopLevelStmt", stmt: got.value, line: tok.line});
  } else if (tok.type == "AT" && tok.value != "@test") {
    let ann_got = ps_parse_annotations(st);
    let s = ann_got.st;
    let pre_anns = ann_got.value;
    let next = ps_peek(s);
    if (next.type == "KW_FN") {
      let got = ps_parse_fn_decl(s, false);
      let decl = got.value;
      if (decl.kind == "FnDecl") {
        decl.annotations = pre_anns.concat(decl.annotations);
      }
      return ParseVal(got.st, decl);
    } else if (next.type == "KW_ASYNC") {
      let adv = ps_advance(s);
      let got = ps_parse_fn_decl(adv.st, true);
      let decl = got.value;
      if (decl.kind == "FnDecl") {
        decl.annotations = pre_anns.concat(decl.annotations);
      }
      return ParseVal(got.st, decl);
    } else if (next.type == "KW_EXPORT") {
      let got = ps_parse_export_decl(s);
      let exported = got.value;
      if (exported.decl.kind == "FnDecl") {
        exported.decl.annotations = pre_anns.concat(exported.decl.annotations);
      }
      return ParseVal(got.st, exported);
    } else {
      return ps_parse_top_level_expr(s);
    }
  } else if (tok.type != "EOF") {
    return ps_parse_top_level_expr(st);
  } else {
    let adv = ps_advance(st);
    return ParseVal(adv.st, null);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_top_level_expr = (st) => {
  let tok = ps_peek(st);
  let line = tok.line;
  let got = ps_parse_expr(st);
  return ParseVal(got.st, {kind: "TopLevelExpr", expr: got.value, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_store_decl = (st) => {
  let adv = ps_advance(st);
  let line = adv.value.line;
  let s = adv.st;
  let name_got = ps_expect(s, "IDENT");
  s = name_got.st;
  let name = name_got.value.value;
  s = ps_expect(s, "LBRACE").st;
  let fields = [];
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    let fn_got = ps_expect(s, "IDENT");
    s = fn_got.st;
    let field_name = fn_got.value.value;
    s = ps_expect(s, "COLON").st;
    let ty_got = ps_parse_type_expr(s);
    s = ty_got.st;
    s = ps_expect(s, "ASSIGN").st;
    let val_got = ps_parse_expr(s);
    s = val_got.st;
    fields = fields.concat([{name: field_name, type: ty_got.value, defaultValue: val_got.value}]);
    s = ps_try_consume(s, "SEMICOLON").st;
    s = ps_try_consume(s, "COMMA").st;
  }
  s = ps_expect(s, "RBRACE").st;
  return ParseVal(s, {kind: "StoreDecl", name: name, fields: fields, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_on_change_expr = (st) => {
  let store_got = ps_expect(st, "IDENT");
  let s = store_got.st;
  let store_name = store_got.value.value;
  s = ps_expect(s, "DOT").st;
  s = ps_expect(s, "IDENT").st;
  s = ps_expect(s, "LBRACE").st;
  let body_got = ps_parse_block_body(s, true);
  s = body_got.st;
  s = ps_expect(s, "RBRACE").st;
  let block_body = wrap_block_body(body_got.value, "ExprStmt");
  let callee = mk_member_expr({kind: "Identifier", name: store_name}, "subscribe", false);
  let lambda = {kind: "LambdaExpr", params: [], body: block_body};
  return ParseVal(s, mk_call_expr(callee, [lambda], false));
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_top_level_let = (st) => {
  let adv = ps_advance(st);
  let line = adv.value.line;
  let s = adv.st;
  s = ps_try_consume(s, "KW_MUT").st;
  let name_got = ps_parse_let_name(s);
  s = name_got.st;
  s = ps_expect(s, "ASSIGN").st;
  let val_got = ps_parse_expr(s);
  s = val_got.st;
  s = ps_try_consume(s, "SEMICOLON").st;
  return ParseVal(s, {kind: "TopLevelLet", name: name_got.value, value: val_got.value, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_let_name = (st) => {
  if (ps_check(st, "UNDERSCORE")) {
    let adv = ps_advance(st);
    return ParseVal(adv.st, null);
  } else if (ps_check(st, "IDENT") && ps_peek(st).value == "_") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, null);
  } else {
    let got = ps_expect(st, "IDENT");
    return ParseVal(got.st, got.value.value);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_test_decl = (st) => {
  let adv = ps_advance(st);
  let line = adv.value.line;
  let s = adv.st;
  let desc_got = ps_expect(s, "STRING");
  s = desc_got.st;
  s = ps_expect(s, "LBRACE").st;
  let body_got = ps_parse_block_body(s, false);
  s = body_got.st;
  s = ps_expect(s, "RBRACE").st;
  return ParseVal(s, {kind: "TestDecl", description: desc_got.value.value, body: body_got.value, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_import_decl = (st) => {
  let adv = ps_advance(st);
  let line = adv.value.line;
  let s = adv.st;
  let names = [];
  s = ps_expect(s, "LBRACE").st;
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    let id_got = ps_expect(s, "IDENT");
    s = id_got.st;
    names = names.concat([id_got.value.value]);
    if (ps_check(s, "COMMA")) {
      s = ps_advance(s).st;
    }
  }
  s = ps_expect(s, "RBRACE").st;
  s = ps_expect(s, "KW_FROM").st;
  let src_got = ps_expect(s, "STRING");
  return ParseVal(src_got.st, {kind: "ImportDecl", names: names, source: src_got.value.value, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_export_decl = (st) => {
  let adv = ps_advance(st);
  let line = adv.value.line;
  let s = adv.st;
  let tok = ps_peek(s);
  let decl_got = (() => {
    if (tok.type == "KW_FN") {
      return ps_parse_fn_decl(s, false);
    } else if (tok.type == "KW_TYPE") {
      return ps_parse_type_alias_or_union(s);
    } else if (tok.type == "KW_RECORD") {
      return ps_parse_record(s);
    } else {
      let err = {severity: "error", message: "Expected fn, type, or record after export", line: tok.line, col: tok.col};
      return ParseVal(ParserState(s.tokens, s.pos, s.in_match_guard, s.errors.concat([err])), null);
    }
})();
  return ParseVal(decl_got.st, {kind: "ExportDecl", decl: decl_got.value, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_enum_decl = (st) => {
  let kw_got = ps_expect(st, "KW_ENUM");
  let line = kw_got.value.line;
  let s = kw_got.st;
  let name_got = ps_expect(s, "IDENT");
  s = name_got.st;
  s = ps_expect(s, "ASSIGN").st;
  let variants = [];
  if (ps_check(s, "PIPE")) {
    s = ps_advance(s).st;
  }
  let v0 = ps_expect(s, "IDENT");
  s = v0.st;
  variants = variants.concat([v0.value.value]);
  while (ps_check(s, "PIPE")) {
    s = ps_advance(s).st;
    let vn = ps_expect(s, "IDENT");
    s = vn.st;
    variants = variants.concat([vn.value.value]);
  }
  return ParseVal(s, {kind: "EnumDecl", name: name_got.value.value, variants: variants, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_type_alias_or_union = (st) => {
  let kw_got = ps_expect(st, "KW_TYPE");
  let line = kw_got.value.line;
  let s = kw_got.st;
  let name_got = ps_expect(s, "IDENT");
  s = name_got.st;
  let tp_got = ps_parse_type_params(s);
  s = tp_got.st;
  s = ps_expect(s, "ASSIGN").st;
  if (ps_check(s, "PIPE")) {
    return ps_parse_tagged_union_body(s, name_got.value.value, tp_got.value, line);
  } else {
    let ty_got = ps_parse_type_expr(s);
    s = ty_got.st;
    let constraint = null;
    if (ps_check(s, "KW_WHERE")) {
      s = ps_advance(s).st;
      let c_got = ps_parse_constraint(s);
      s = c_got.st;
      constraint = c_got.value;
    }
    if (constraint == null) {
      return ParseVal(s, {kind: "TypeAlias", name: name_got.value.value, typeParams: tp_got.value, type: ty_got.value, line: line});
    } else {
      return ParseVal(s, {kind: "TypeAlias", name: name_got.value.value, typeParams: tp_got.value, type: ty_got.value, constraint: constraint, line: line});
    }
  }
};

/**
 * @param {ParserState} st
 * @param {string} name
 * @param {*} type_params
 * @param {number} line
 * @returns {ParseVal}
 */
const ps_parse_tagged_union_body = (st, name, type_params, line) => {
  let s = st;
  let variants = [];
  while (ps_check(s, "PIPE")) {
    s = ps_advance(s).st;
    let vn = ps_expect(s, "IDENT");
    s = vn.st;
    let fields = [];
    if (ps_check(s, "LBRACE")) {
      s = ps_advance(s).st;
      while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
        let fn_got = ps_expect(s, "IDENT");
        s = fn_got.st;
        s = ps_expect(s, "COLON").st;
        let ft_got = ps_parse_type_expr(s);
        s = ft_got.st;
        fields = fields.concat([{name: fn_got.value.value, type: ft_got.value}]);
        s = ps_try_consume(s, "COMMA").st;
      }
      s = ps_expect(s, "RBRACE").st;
    }
    variants = variants.concat([{name: vn.value.value, fields: fields}]);
  }
  return ParseVal(s, {kind: "TaggedUnionDecl", name: name, variants: variants, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_constraint = (st) => ps_parse_or_constraint(st);

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_or_constraint = (st) => {
  let left_got = ps_parse_and_constraint(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "OR")) {
    s = ps_advance(s).st;
    let right_got = ps_parse_and_constraint(s);
    s = right_got.st;
    left = {kind: "OrConstraint", left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_and_constraint = (st) => {
  let left_got = ps_parse_unary_constraint(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "AND")) {
    s = ps_advance(s).st;
    let right_got = ps_parse_unary_constraint(s);
    s = right_got.st;
    left = {kind: "AndConstraint", left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_unary_constraint = (st) => {
  if (ps_check(st, "BANG")) {
    let adv = ps_advance(st);
    let inner_got = ps_parse_unary_constraint(adv.st);
    return ParseVal(inner_got.st, {kind: "NotConstraint", inner: inner_got.value});
  } else {
    return ps_parse_primary_constraint(st);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_primary_constraint = (st) => {
  let tok = ps_peek(st);
  if (tok.type == "IDENT" && tok.value == "matches") {
    let adv = ps_advance(st);
    let s = adv.st;
    s = ps_expect(s, "LPAREN").st;
    let arg = ps_peek(s);
    if (arg.type == "REGEX") {
      let rx_adv = ps_advance(s);
      s = rx_adv.st;
      let parts = regex_parts(rx_adv.value.value);
      s = ps_expect(s, "RPAREN").st;
      return ParseVal(s, {kind: "RegexConstraint", pattern: parts.pattern, flags: parts.flags});
    } else if (arg.type == "AT" || arg.type == "IDENT" && (arg.value.slice(0, 1) == "@" || arg.value.slice(0, 1) == "#")) {
      let preset_adv = ps_advance(s);
      s = preset_adv.st;
      let raw = preset_adv.value.value;
      let preset = (() => {
        if (raw.slice(0, 1) == "@" || raw.slice(0, 1) == "#") {
          return raw.slice(1);
        } else {
          return raw;
        }
})();
      s = ps_expect(s, "RPAREN").st;
      return ParseVal(s, {kind: "MatchesConstraint", preset: preset});
    } else {
      s = ps_expect(s, "RPAREN").st;
      return ParseVal(s, {kind: "MatchesConstraint", preset: "custom"});
    }
  } else if (tok.type == "IDENT" && tok.value == "length") {
    let adv = ps_advance(st);
    let s = adv.st;
    let op_tok = ps_peek(s);
    if (op_tok.type == "GT" || op_tok.type == "GTE" || op_tok.type == "LT" || op_tok.type == "LTE" || op_tok.type == "EQ" || op_tok.type == "STRICT_EQ") {
      let op_adv = ps_advance(s);
      s = op_adv.st;
      let num_got = ps_expect(s, "NUMBER");
      return ParseVal(num_got.st, {kind: "LengthConstraint", op: op_adv.value.value, value: $parse_float(num_got.value.value)});
    } else {
      return ParseVal(s, {kind: "LengthConstraint", op: ">", value: 0});
    }
  } else if (tok.type == "GT" || tok.type == "GTE" || tok.type == "LT" || tok.type == "LTE" || tok.type == "EQ" || tok.type == "STRICT_EQ" || tok.type == "NEQ") {
    let op_adv = ps_advance(st);
    let s = op_adv.st;
    let num_tok = ps_peek(s);
    if (num_tok.type == "MINUS") {
      s = ps_advance(s).st;
      let neg = ps_peek(s);
      if (neg.type == "NUMBER") {
        let n_adv = ps_advance(s);
        return ParseVal(n_adv.st, {kind: "CompareConstraint", op: op_adv.value.value, value: 0.0 - $parse_float(n_adv.value.value)});
      } else {
        return ps_parse_constraint_value(s, op_adv.value.value);
      }
    } else {
      return ps_parse_constraint_value(s, op_adv.value.value);
    }
  } else if (tok.type == "LPAREN") {
    let adv = ps_advance(st);
    let inner_got = ps_parse_constraint(adv.st);
    let s = inner_got.st;
    s = ps_expect(s, "RPAREN").st;
    return ParseVal(s, inner_got.value);
  } else {
    let expr_got = ps_parse_expr(st);
    return ParseVal(expr_got.st, {kind: "CustomConstraint", expr: expr_got.value});
  }
};

/**
 * @param {ParserState} st
 * @param {string} op
 * @returns {ParseVal}
 */
const ps_parse_constraint_value = (st, op) => {
  let num_tok = ps_peek(st);
  if (num_tok.type == "NUMBER") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "CompareConstraint", op: op, value: $parse_float(adv.value.value)});
  } else if (num_tok.type == "STRING") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "CompareConstraint", op: op, value: adv.value.value});
  } else if (num_tok.type == "IDENT") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "CompareConstraint", op: op, value: adv.value.value});
  } else {
    return ParseVal(st, {kind: "CompareConstraint", op: op, value: 0});
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_record = (st) => {
  let kw_got = ps_expect(st, "KW_RECORD");
  let line = kw_got.value.line;
  let s = kw_got.st;
  let name_got = ps_expect(s, "IDENT");
  s = name_got.st;
  let tp_got = ps_parse_type_params(s);
  s = tp_got.st;
  s = ps_expect(s, "LBRACE").st;
  let fields = [];
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    let fn_got = ps_expect_ident_or_keyword(s);
    s = fn_got.st;
    s = ps_expect(s, "COLON").st;
    let ty_got = ps_parse_type_expr(s);
    s = ty_got.st;
    fields = fields.concat([{name: fn_got.value.value, type: ty_got.value}]);
    s = ps_try_consume(s, "COMMA").st;
  }
  s = ps_expect(s, "RBRACE").st;
  return ParseVal(s, {kind: "RecordDecl", name: name_got.value.value, typeParams: tp_got.value, fields: fields, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_interface_decl = (st) => {
  let kw_got = ps_expect(st, "KW_INTERFACE");
  let line = kw_got.value.line;
  let s = kw_got.st;
  let name_got = ps_expect(s, "IDENT");
  s = name_got.st;
  let tp_got = ps_parse_type_params(s);
  s = tp_got.st;
  s = ps_expect(s, "LBRACE").st;
  let fields = [];
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    let fn_got = ps_expect(s, "IDENT");
    s = fn_got.st;
    s = ps_expect(s, "COLON").st;
    let ty_got = ps_parse_type_expr(s);
    s = ty_got.st;
    fields = fields.concat([{name: fn_got.value.value, type: ty_got.value}]);
    s = ps_try_consume(s, "SEMICOLON").st;
    s = ps_try_consume(s, "COMMA").st;
  }
  s = ps_expect(s, "RBRACE").st;
  return ParseVal(s, {kind: "InterfaceDecl", name: name_got.value.value, typeParams: tp_got.value, fields: fields, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_type_params = (st) => {
  if (!ps_check(st, "LT")) {
    return ParseVal(st, []);
  } else {
    let adv = ps_advance(st);
    let s = adv.st;
    let params = [];
    while (!ps_check(s, "GT") && !ps_is_eof(s)) {
      let id_got = ps_expect(s, "IDENT");
      s = id_got.st;
      params = params.concat([id_got.value.value]);
      s = ps_try_consume(s, "COMMA").st;
    }
    s = ps_expect(s, "GT").st;
    return ParseVal(s, params);
  }
};

/**
 * @param {ParserState} st
 * @param {boolean} is_async
 * @returns {ParseVal}
 */
const ps_parse_fn_decl = (st, is_async) => {
  let kw_got = ps_expect(st, "KW_FN");
  let line = kw_got.value.line;
  let s = kw_got.st;
  let name_got = ps_expect(s, "IDENT");
  s = name_got.st;
  let tp_got = ps_parse_type_params(s);
  s = tp_got.st;
  if (ps_check(s, "LPAREN") && !ps_is_double_colon_ahead(s)) {
    s = ps_advance(s).st;
    let params_got = ps_parse_short_fn_params(s);
    s = params_got.st;
    let return_type = {name: "any", isArray: false, isOptional: false};
    if (ps_check(s, "THIN_ARROW")) {
      s = ps_advance(s).st;
      let rt_got = ps_parse_type_expr(s);
      s = rt_got.st;
      return_type = rt_got.value;
    }
    let body = null;
    let short_form = true;
    if (ps_check(s, "ASSIGN")) {
      s = ps_advance(s).st;
      let expr_got = ps_parse_expr(s);
      s = expr_got.st;
      body = expr_got.value;
    } else {
      s = ps_expect(s, "LBRACE").st;
      let ann_got = ps_parse_annotations(s);
      s = ann_got.st;
      let block_got = ps_parse_block_body(s, false);
      s = block_got.st;
      s = ps_expect(s, "RBRACE").st;
      body = block_got.value;
      short_form = false;
    }
    return ParseVal(s, mk_fn_decl(name_got.value.value, tp_got.value, params_got.value, return_type, [], body, short_form, is_async, line));
  } else {
    s = ps_expect(s, "DOUBLE_COLON").st;
    s = ps_expect(s, "LPAREN").st;
    let params_got = ps_parse_full_fn_params(s);
    s = params_got.st;
    s = ps_expect(s, "THIN_ARROW").st;
    let rt_got = ps_parse_type_expr(s);
    s = rt_got.st;
    s = ps_expect(s, "LBRACE").st;
    let ann_got = ps_parse_annotations(s);
    s = ann_got.st;
    let block_got = ps_parse_block_body(s, false);
    s = block_got.st;
    s = ps_expect(s, "RBRACE").st;
    if (is_async) {
      return ParseVal(s, {kind: "FnDecl", name: name_got.value.value, typeParams: tp_got.value, params: params_got.value, returnType: rt_got.value, annotations: ann_got.value, body: block_got.value, isAsync: true, line: line});
    } else {
      return ParseVal(s, {kind: "FnDecl", name: name_got.value.value, typeParams: tp_got.value, params: params_got.value, returnType: rt_got.value, annotations: ann_got.value, body: block_got.value, line: line});
    }
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_short_fn_params = (st) => {
  let s = st;
  let params = [];
  while (!ps_check(s, "RPAREN") && !ps_is_eof(s)) {
    let spread_got = ps_try_consume(s, "SPREAD");
    s = spread_got.st;
    let spread = spread_got.value != null;
    let pn_got = ps_expect_ident_or_keyword(s);
    s = pn_got.st;
    let param_type = {name: "any", isArray: false, isOptional: false};
    if (ps_check(s, "COLON")) {
      s = ps_advance(s).st;
      let ty_got = ps_parse_type_expr(s);
      s = ty_got.st;
      param_type = ty_got.value;
    }
    params = params.concat([{name: pn_got.value.value, type: param_type, spread: spread}]);
    s = ps_try_consume(s, "COMMA").st;
  }
  s = ps_expect(s, "RPAREN").st;
  return ParseVal(s, params);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_full_fn_params = (st) => {
  let s = st;
  let params = [];
  while (!ps_check(s, "RPAREN") && !ps_is_eof(s)) {
    let spread_got = ps_try_consume(s, "SPREAD");
    s = spread_got.st;
    let spread = spread_got.value != null;
    let pn_got = ps_expect_ident_or_keyword(s);
    s = pn_got.st;
    s = ps_expect(s, "COLON").st;
    let ty_got = ps_parse_type_expr(s);
    s = ty_got.st;
    params = params.concat([{name: pn_got.value.value, type: ty_got.value, spread: spread}]);
    s = ps_try_consume(s, "COMMA").st;
  }
  s = ps_expect(s, "RPAREN").st;
  return ParseVal(s, params);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_module = (st) => {
  let kw_got = ps_expect(st, "KW_MODULE");
  let line = kw_got.value.line;
  let s = kw_got.st;
  let name_got = ps_expect(s, "IDENT");
  s = name_got.st;
  s = ps_expect(s, "LBRACE").st;
  let ann_got = ps_parse_annotations(s);
  s = ann_got.st;
  let body = [];
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    let decl_got = ps_parse_top_level(s);
    s = decl_got.st;
    if (decl_got.value != null) {
      body = body.concat([decl_got.value]);
    }
  }
  s = ps_expect(s, "RBRACE").st;
  return ParseVal(s, {kind: "ModuleDecl", name: name_got.value.value, annotations: ann_got.value, body: body, line: line});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_annotations = (st) => {
  let s = st;
  let anns = [];
  while (ps_check(s, "AT")) {
    let adv = ps_advance(s);
    s = adv.st;
    let ann_name = adv.value.value.slice(1);
    if (ann_name == "test") {
    } else {
      let value = null;
      if (ps_check(s, "STRING")) {
        let sg = ps_advance(s);
        s = sg.st;
        value = sg.value.value;
      } else if (ps_check(s, "LBRACKET")) {
        s = ps_advance(s).st;
        let parts = [];
        while (!ps_check(s, "RBRACKET") && !ps_is_eof(s)) {
          let pg = ps_advance(s);
          s = pg.st;
          parts = parts.concat([pg.value.value]);
          s = ps_try_consume(s, "COMMA").st;
        }
        s = ps_expect(s, "RBRACKET").st;
        value = parts;
      }
      anns = anns.concat([{name: ann_name, value: value}]);
    }
  }
  return ParseVal(s, anns);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_type_expr = (st) => {
  if (ps_check(st, "LBRACE")) {
    let adv = ps_advance(st);
    let s = adv.st;
    let fields = [];
    while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
      let fn_got = ps_expect(s, "IDENT");
      s = fn_got.st;
      s = ps_expect(s, "COLON").st;
      let ft_got = ps_parse_type_expr(s);
      s = ft_got.st;
      fields = fields.concat([{name: fn_got.value.value, type: ft_got.value}]);
      s = ps_try_consume(s, "COMMA").st;
    }
    s = ps_expect(s, "RBRACE").st;
    let type_args = [];
    let fi = 0;
    while (fi < fields.length) {
      let f = fields[fi];
      type_args = type_args.concat([{name: f.name, typeArgs: [f.type]}]);
      fi = fi + 1;
    }
    return ParseVal(s, {name: "__object__", typeArgs: type_args});
  } else if (ps_check(st, "KW_FN")) {
    let adv = ps_advance(st);
    let s = adv.st;
    s = ps_expect(s, "LPAREN").st;
    let fn_params = [];
    while (!ps_check(s, "RPAREN") && !ps_is_eof(s)) {
      let p_got = ps_parse_type_expr(s);
      s = p_got.st;
      fn_params = fn_params.concat([p_got.value]);
      s = ps_try_consume(s, "COMMA").st;
    }
    s = ps_expect(s, "RPAREN").st;
    let fn_return = {name: "any", isArray: false, isOptional: false};
    if (ps_check(s, "THIN_ARROW")) {
      s = ps_advance(s).st;
      let rt_got = ps_parse_type_expr(s);
      s = rt_got.st;
      fn_return = rt_got.value;
    }
    return ParseVal(s, mk_fn_type(fn_params, fn_return));
  } else if (ps_check(st, "IDENT") && ps_peek(st).value == "void") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {name: "void", isArray: false, isOptional: false});
  } else {
    let id_got = ps_expect(st, "IDENT");
    let s = id_got.st;
    let name = id_got.value.value;
    let type_args = [];
    if (ps_check(s, "LT")) {
      s = ps_advance(s).st;
      let ta_got = ps_parse_type_expr(s);
      s = ta_got.st;
      type_args = type_args.concat([ta_got.value]);
      while (ps_check(s, "COMMA")) {
        s = ps_advance(s).st;
        let ta2 = ps_parse_type_expr(s);
        s = ta2.st;
        type_args = type_args.concat([ta2.value]);
      }
      s = ps_expect(s, "GT").st;
    }
    let is_array = false;
    if (ps_check(s, "LBRACKET") && ps_token_at(s, 1).type == "RBRACKET") {
      s = ps_advance(s).st;
      s = ps_advance(s).st;
      is_array = true;
    }
    let is_optional = false;
    if (ps_check(s, "QUESTION")) {
      s = ps_advance(s).st;
      is_optional = true;
    }
    return ParseVal(s, mk_type_expr(name, type_args, is_array, is_optional));
  }
};

/**
 * @param {*} block
 * @returns {*}
 */
const inject_tail_into_block = (block) => {
  if (block.kind != "BlockExpr") {
    return block;
  }
  let stmts = block.stmts;
  if (stmts.length == 0) {
    return block;
  }
  let last = stmts[stmts.length - 1];
  if (last.kind == "ExprStmt") {
    let new_last = {kind: "ReturnStmt", value: last.value};
    return {kind: "BlockExpr", stmts: stmts.slice(0, stmts.length - 1).concat([new_last])};
  } else if (last.kind == "IfStmt") {
    let fixed = inject_tail_returns_if(last);
    return {kind: "BlockExpr", stmts: stmts.slice(0, stmts.length - 1).concat([fixed])};
  } else {
    return block;
  }
};

/**
 * @param {*} stmt
 * @returns {*}
 */
const inject_tail_returns_if = (stmt) => {
  let then_b = inject_tail_into_block(stmt.then);
  let else_b = (() => {
    if (stmt.else_ == null) {
      return null;
    } else {
      return inject_tail_into_block(stmt.else_);
    }
})();
  return mk_if_stmt(stmt.test, then_b, else_b);
};

/**
 * @param {ParserState} st
 * @param {boolean} stmt_mode
 * @returns {ParseVal}
 */
const ps_parse_block_body = (st, stmt_mode) => {
  let s = st;
  let stmts = [];
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    let stmt_got = ps_parse_block_stmt(s, stmt_mode);
    s = stmt_got.st;
    if (stmt_got.value != null) {
      stmts = stmts.concat([stmt_got.value]);
    }
  }
  if (!stmt_mode && stmts.length > 0) {
    let last = stmts[stmts.length - 1];
    if (last.kind == "IfStmt") {
      let fixed = inject_tail_returns_if(last);
      stmts = stmts.slice(0, stmts.length - 1).concat([fixed]);
    }
  }
  if (!stmt_mode && stmts.length == 1 && stmts[0].kind == "ReturnStmt") {
    return ParseVal(s, stmts[0].value);
  } else {
    return ParseVal(s, {kind: "BlockExpr", stmts: stmts});
  }
};

/**
 * @param {ParserState} st
 * @param {boolean} stmt_mode
 * @returns {ParseVal}
 */
const ps_parse_block_stmt = (st, stmt_mode) => {
  if (ps_check(st, "KW_RETURN")) {
    return ps_parse_return_stmt(st);
  } else if (ps_check(st, "KW_IF")) {
    return ps_parse_if_stmt(st, true);
  } else if (ps_check(st, "KW_FN")) {
    let fn_got = ps_parse_fn_decl(st, false);
    let fndecl = fn_got.value;
    let param_names = [];
    let pi = 0;
    while (pi < fndecl.params.length) {
      param_names = param_names.concat([fndecl.params[pi].name]);
      pi = pi + 1;
    }
    let lambda = {kind: "LambdaExpr", params: param_names, body: fndecl.body};
    return ParseVal(fn_got.st, {kind: "LetStmt", name: fndecl.name, value: lambda, mutable: false, infer: false});
  } else if (ps_check(st, "KW_BREAK")) {
    let adv = ps_advance(st);
    let s = ps_try_consume(adv.st, "SEMICOLON").st;
    return ParseVal(s, {kind: "BreakStmt"});
  } else if (ps_check(st, "KW_CONTINUE")) {
    let adv = ps_advance(st);
    let s = ps_try_consume(adv.st, "SEMICOLON").st;
    return ParseVal(s, {kind: "ContinueStmt"});
  } else if (ps_check(st, "IDENT") && ps_peek(st).value == "on") {
    let t1 = ps_token_at(st, 1);
    let t2 = ps_token_at(st, 2);
    if (t1.type == "IDENT" && t2.type == "DOT") {
      let adv = ps_advance(st);
      let got = ps_parse_on_change_expr(adv.st);
      let s = ps_try_consume(got.st, "SEMICOLON").st;
      return ParseVal(s, {kind: "ExprStmt", value: got.value});
    } else {
      return ps_parse_block_expr_stmt(st, stmt_mode);
    }
  } else if (ps_check(st, "KW_REFINE")) {
    let adv = ps_advance(st);
    let s = adv.st;
    let nm = ps_expect(s, "IDENT");
    s = nm.st;
    s = ps_expect(s, "COLON").st;
    let cl = ps_expect(s, "STRING");
    s = cl.st;
    s = ps_try_consume(s, "SEMICOLON").st;
    return ParseVal(s, {kind: "RefineStmt", name: nm.value.value, claim: cl.value.value});
  } else if (ps_check(st, "KW_FOR")) {
    return ps_parse_for_stmt(st);
  } else if (ps_check(st, "KW_WHILE")) {
    return ps_parse_while_stmt(st);
  } else if (ps_check(st, "KW_LET")) {
    return ps_parse_let_stmt(st);
  } else {
    return ps_parse_block_expr_stmt(st, stmt_mode);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_return_stmt = (st) => {
  let adv = ps_advance(st);
  let s = adv.st;
  if (ps_check(s, "RBRACE") || ps_check(s, "SEMICOLON") || ps_is_eof(s)) {
    s = ps_try_consume(s, "SEMICOLON").st;
    return ParseVal(s, {kind: "ReturnStmt", value: {kind: "Identifier", name: "undefined"}});
  } else {
    let expr_got = ps_parse_expr(s);
    let val = ps_try_propagation(expr_got.st, expr_got.value);
    s = ps_try_consume(val.st, "SEMICOLON").st;
    return ParseVal(s, {kind: "ReturnStmt", value: val.value});
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_let_stmt = (st) => {
  let adv = ps_advance(st);
  let s = adv.st;
  let mutable = ps_check(s, "KW_MUT");
  if (mutable) {
    s = ps_advance(s).st;
  }
  let infer_flag = ps_check(s, "KW_INFER");
  if (infer_flag) {
    s = ps_advance(s).st;
  }
  if (ps_check(s, "LBRACE")) {
    return ps_parse_destructure_object(s, mutable, infer_flag);
  } else if (ps_check(s, "LBRACKET")) {
    return ps_parse_destructure_array(s, mutable, infer_flag);
  } else {
    let name_got = ps_parse_let_name(s);
    s = name_got.st;
    s = ps_expect(s, "ASSIGN").st;
    let expr_got = ps_parse_expr(s);
    s = expr_got.st;
    let val = ps_try_propagation(s, expr_got.value);
    s = val.st;
    s = ps_try_consume(s, "SEMICOLON").st;
    return ParseVal(s, {kind: "LetStmt", name: name_got.value, value: val.value, mutable: mutable, infer: infer_flag});
  }
};

/**
 * @param {ParserState} st
 * @param {boolean} mutable
 * @param {boolean} infer_flag
 * @returns {ParseVal}
 */
const ps_parse_destructure_object = (st, mutable, infer_flag) => {
  let adv = ps_advance(st);
  let s = adv.st;
  let names = [];
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    let key_got = ps_expect(s, "IDENT");
    s = key_got.st;
    if (ps_check(s, "COLON")) {
      s = ps_advance(s).st;
      let alias_got = ps_expect(s, "IDENT");
      s = alias_got.st;
      names = names.concat([key_got.value.value + ": " + alias_got.value.value]);
    } else {
      names = names.concat([key_got.value.value]);
    }
    s = ps_try_consume(s, "COMMA").st;
  }
  s = ps_expect(s, "RBRACE").st;
  s = ps_expect(s, "ASSIGN").st;
  let val_got = ps_parse_expr(s);
  s = val_got.st;
  s = ps_try_consume(s, "SEMICOLON").st;
  return ParseVal(s, {kind: "DestructureStmt", style: "object", names: names, value: val_got.value});
};

/**
 * @param {ParserState} st
 * @param {boolean} mutable
 * @param {boolean} infer_flag
 * @returns {ParseVal}
 */
const ps_parse_destructure_array = (st, mutable, infer_flag) => {
  let adv = ps_advance(st);
  let s = adv.st;
  let names = [];
  while (!ps_check(s, "RBRACKET") && !ps_is_eof(s)) {
    if (ps_check(s, "COMMA")) {
      s = ps_advance(s).st;
      names = names.concat(["_"]);
    } else {
      let id_got = ps_expect(s, "IDENT");
      s = id_got.st;
      names = names.concat([id_got.value.value]);
      s = ps_try_consume(s, "COMMA").st;
    }
  }
  s = ps_expect(s, "RBRACKET").st;
  s = ps_expect(s, "ASSIGN").st;
  let val_got = ps_parse_expr(s);
  s = val_got.st;
  s = ps_try_consume(s, "SEMICOLON").st;
  return ParseVal(s, {kind: "DestructureStmt", style: "array", names: names, value: val_got.value});
};

/**
 * @param {ParserState} st
 * @param {boolean} stmt_mode
 * @returns {ParseVal}
 */
const ps_parse_block_expr_stmt = (st, stmt_mode) => {
  let expr_got = ps_parse_expr(st);
  let s = expr_got.st;
  let val = ps_try_propagation(s, expr_got.value);
  s = val.st;
  s = ps_try_consume(s, "SEMICOLON").st;
  if (!stmt_mode && (ps_check(s, "RBRACE") || ps_is_eof(s))) {
    return ParseVal(s, {kind: "ReturnStmt", value: val.value});
  } else {
    return ParseVal(s, {kind: "ExprStmt", value: val.value});
  }
};

/**
 * @param {ParserState} st
 * @param {boolean} stmt_mode
 * @returns {ParseVal}
 */
const ps_parse_if_stmt = (st, stmt_mode) => {
  let s = ps_expect(st, "KW_IF").st;
  let has_parens = ps_check(s, "LPAREN");
  if (has_parens) {
    s = ps_advance(s).st;
  }
  let test_got = ps_parse_expr(s);
  s = test_got.st;
  if (has_parens) {
    s = ps_expect(s, "RPAREN").st;
  }
  s = ps_expect(s, "LBRACE").st;
  let then_got = ps_parse_block_body(s, stmt_mode);
  s = then_got.st;
  s = ps_expect(s, "RBRACE").st;
  let fallback = (() => {
    if (stmt_mode) {
      return "ExprStmt";
    } else {
      return "ReturnStmt";
    }
})();
  let then_block = wrap_block_body(then_got.value, fallback);
  let else_block = null;
  if (ps_check(s, "KW_ELSE")) {
    s = ps_advance(s).st;
    if (ps_check(s, "KW_IF")) {
      let nested = ps_parse_if_stmt(s, stmt_mode);
      s = nested.st;
      else_block = {kind: "BlockExpr", stmts: [nested.value]};
    } else {
      s = ps_expect(s, "LBRACE").st;
      let else_got = ps_parse_block_body(s, stmt_mode);
      s = else_got.st;
      s = ps_expect(s, "RBRACE").st;
      else_block = wrap_block_body(else_got.value, fallback);
    }
  }
  return ParseVal(s, mk_if_stmt(test_got.value, then_block, else_block));
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_for_stmt = (st) => {
  let s = ps_expect(st, "KW_FOR").st;
  let var_got = ps_expect(s, "IDENT");
  s = var_got.st;
  s = ps_expect(s, "KW_IN").st;
  let lo_got = ps_parse_expr(s);
  s = lo_got.st;
  if (ps_check(s, "DOTDOT") || ps_check(s, "DOTDOTEQ")) {
    let inclusive = ps_check(s, "DOTDOTEQ");
    s = ps_advance(s).st;
    let hi_got = ps_parse_expr(s);
    s = hi_got.st;
    s = ps_expect(s, "LBRACE").st;
    let body_got = ps_parse_block_body(s, true);
    s = body_got.st;
    s = ps_expect(s, "RBRACE").st;
    let body = wrap_block_body(body_got.value, "ExprStmt");
    return ParseVal(s, {kind: "ForRangeStmt", varName: var_got.value.value, lo: lo_got.value, hi: hi_got.value, inclusive: inclusive, body: body});
  } else {
    s = ps_expect(s, "LBRACE").st;
    let body_got = ps_parse_block_body(s, true);
    s = body_got.st;
    s = ps_expect(s, "RBRACE").st;
    let body = wrap_block_body(body_got.value, "ExprStmt");
    return ParseVal(s, {kind: "ForInStmt", varName: var_got.value.value, iter: lo_got.value, body: body});
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_while_stmt = (st) => {
  let s = ps_expect(st, "KW_WHILE").st;
  let test_got = ps_parse_expr(s);
  s = test_got.st;
  s = ps_expect(s, "LBRACE").st;
  let body_got = ps_parse_block_body(s, true);
  s = body_got.st;
  s = ps_expect(s, "RBRACE").st;
  let body = wrap_block_body(body_got.value, "ExprStmt");
  return ParseVal(s, {kind: "WhileStmt", test: test_got.value, body: body});
};

/**
 * @param {ParserState} st
 * @param {*} expr
 * @returns {ParseVal}
 */
const ps_try_propagation = (st, expr) => {
  if (ps_check(st, "QUESTION")) {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "ResultPropagateExpr", value: expr});
  } else {
    return ParseVal(st, expr);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_expr = (st) => {
  let left_got = ps_parse_pipeline(st);
  let s = left_got.st;
  let left = left_got.value;
  if (ps_check(s, "ASSIGN") && ps_is_assignable(left)) {
    s = ps_advance(s).st;
    let right_got = ps_parse_expr(s);
    return ParseVal(right_got.st, {kind: "BinaryExpr", op: "=", left: left, right: right_got.value});
  } else if (ps_check(s, "PLUS_EQ") && ps_is_assignable(left)) {
    let adv = ps_advance(s);
    let right_got = ps_parse_expr(adv.st);
    return ParseVal(right_got.st, {kind: "BinaryExpr", op: "+=", left: left, right: right_got.value});
  } else if (ps_check(s, "MINUS_EQ") && ps_is_assignable(left)) {
    let adv = ps_advance(s);
    let right_got = ps_parse_expr(adv.st);
    return ParseVal(right_got.st, {kind: "BinaryExpr", op: "-=", left: left, right: right_got.value});
  } else if (ps_check(s, "STAR_EQ") && ps_is_assignable(left)) {
    let adv = ps_advance(s);
    let right_got = ps_parse_expr(adv.st);
    return ParseVal(right_got.st, {kind: "BinaryExpr", op: "*=", left: left, right: right_got.value});
  } else if (ps_check(s, "SLASH_EQ") && ps_is_assignable(left)) {
    let adv = ps_advance(s);
    let right_got = ps_parse_expr(adv.st);
    return ParseVal(right_got.st, {kind: "BinaryExpr", op: "/=", left: left, right: right_got.value});
  } else if (ps_check(s, "PERCENT_EQ") && ps_is_assignable(left)) {
    let adv = ps_advance(s);
    let right_got = ps_parse_expr(adv.st);
    return ParseVal(right_got.st, {kind: "BinaryExpr", op: "%=", left: left, right: right_got.value});
  } else if (ps_check(s, "NULL_COALESCE_EQ") && ps_is_assignable(left)) {
    let adv = ps_advance(s);
    let right_got = ps_parse_expr(adv.st);
    return ParseVal(right_got.st, {kind: "BinaryExpr", op: "??=", left: left, right: right_got.value});
  } else {
    return ParseVal(s, left);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_pipeline = (st) => {
  let first = ps_parse_ternary(st);
  let s = first.st;
  let steps = [first.value];
  while (ps_check(s, "PIPE_OP")) {
    s = ps_advance(s).st;
    if (ps_check(s, "KW_AS")) {
      s = ps_advance(s).st;
      let nm = ps_expect(s, "IDENT");
      s = nm.st;
      steps = steps.concat([{kind: "PipeAs", name: nm.value.value}]);
    } else {
      let step = ps_parse_ternary(s);
      s = step.st;
      steps = steps.concat([step.value]);
    }
  }
  if (steps.length == 1) {
    return ParseVal(s, steps[0]);
  } else {
    return ParseVal(s, {kind: "PipelineExpr", steps: steps});
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_ternary = (st) => {
  let test_got = ps_parse_nullish(st);
  let s = test_got.st;
  if (ps_check(s, "QUESTION")) {
    let q_tok = ps_peek(s);
    let after_line = ps_token_at(s, 1).line;
    if (after_line > q_tok.line) {
      s = ps_advance(s).st;
      return ParseVal(s, {kind: "ResultPropagateExpr", value: test_got.value});
    } else {
      s = ps_advance(s).st;
      let cons_got = ps_parse_expr(s);
      s = cons_got.st;
      s = ps_expect(s, "COLON").st;
      let alt_got = ps_parse_expr(s);
      return ParseVal(alt_got.st, {kind: "TernaryExpr", test: test_got.value, consequent: cons_got.value, alternate: alt_got.value});
    }
  } else {
    return ParseVal(s, test_got.value);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_nullish = (st) => {
  let left_got = ps_parse_or(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "NULL_COALESCE")) {
    s = ps_advance(s).st;
    let right_got = ps_parse_or(s);
    s = right_got.st;
    left = {kind: "BinaryExpr", op: "??", left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_or = (st) => {
  let left_got = ps_parse_and(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "OR")) {
    let op_adv = ps_advance(s);
    s = op_adv.st;
    let right_got = ps_parse_and(s);
    s = right_got.st;
    left = {kind: "BinaryExpr", op: op_adv.value.value, left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_and = (st) => {
  let left_got = ps_parse_equality(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "AND")) {
    let op_adv = ps_advance(s);
    s = op_adv.st;
    let right_got = ps_parse_equality(s);
    s = right_got.st;
    left = {kind: "BinaryExpr", op: op_adv.value.value, left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_equality = (st) => {
  let left_got = ps_parse_relational(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "EQ") || ps_check(s, "NEQ") || ps_check(s, "STRICT_EQ") || ps_check(s, "STRICT_NEQ")) {
    let op_adv = ps_advance(s);
    s = op_adv.st;
    let right_got = ps_parse_relational(s);
    s = right_got.st;
    left = {kind: "BinaryExpr", op: op_adv.value.value, left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_relational = (st) => {
  let left_got = ps_parse_additive(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "LT") || ps_check(s, "GT") || ps_check(s, "LTE") || ps_check(s, "GTE") || ps_check(s, "KW_INSTANCEOF")) {
    let op_adv = ps_advance(s);
    s = op_adv.st;
    let right_got = ps_parse_additive(s);
    s = right_got.st;
    left = {kind: "BinaryExpr", op: op_adv.value.value, left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_additive = (st) => {
  let left_got = ps_parse_multiplicative(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "PLUS") || ps_check(s, "MINUS")) {
    let op_adv = ps_advance(s);
    s = op_adv.st;
    let right_got = ps_parse_multiplicative(s);
    s = right_got.st;
    left = {kind: "BinaryExpr", op: op_adv.value.value, left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_multiplicative = (st) => {
  let left_got = ps_parse_unary(st);
  let s = left_got.st;
  let left = left_got.value;
  while (ps_check(s, "STAR") || ps_check(s, "SLASH") || ps_check(s, "PERCENT")) {
    let op_adv = ps_advance(s);
    s = op_adv.st;
    let right_got = ps_parse_unary(s);
    s = right_got.st;
    left = {kind: "BinaryExpr", op: op_adv.value.value, left: left, right: right_got.value};
  }
  return ParseVal(s, left);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_unary = (st) => {
  if (ps_check(st, "BANG")) {
    let adv = ps_advance(st);
    let op_got = ps_parse_unary(adv.st);
    return ParseVal(op_got.st, {kind: "UnaryExpr", op: "!", operand: op_got.value, prefix: true});
  } else if (ps_check(st, "MINUS")) {
    let adv = ps_advance(st);
    let op_got = ps_parse_unary(adv.st);
    return ParseVal(op_got.st, {kind: "UnaryExpr", op: "-", operand: op_got.value, prefix: true});
  } else if (ps_check(st, "KW_TYPEOF")) {
    let adv = ps_advance(st);
    let op_got = ps_parse_unary(adv.st);
    return ParseVal(op_got.st, {kind: "UnaryExpr", op: "typeof", operand: op_got.value, prefix: true});
  } else if (ps_check(st, "KW_AWAIT")) {
    let adv = ps_advance(st);
    let val_got = ps_parse_unary(adv.st);
    return ParseVal(val_got.st, {kind: "AwaitExpr", value: val_got.value});
  } else {
    return ps_parse_postfix(st);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_postfix = (st) => {
  let prim = ps_parse_primary(st);
  let s = prim.st;
  let expr = prim.value;
  let looping = true;
  while (looping) {
    if (ps_check(s, "OPTIONAL_CHAIN")) {
      s = ps_advance(s).st;
      if (ps_check(s, "LBRACKET")) {
        s = ps_advance(s).st;
        let idx_got = ps_parse_expr(s);
        s = idx_got.st;
        s = ps_expect(s, "RBRACKET").st;
        expr = mk_index_expr(expr, idx_got.value, true);
      } else if (ps_check(s, "LPAREN")) {
        s = ps_advance(s).st;
        let args_got = ps_parse_arg_list(s);
        s = args_got.st;
        s = ps_expect(s, "RPAREN").st;
        expr = mk_call_expr(expr, args_got.value, true);
      } else {
        let prop_got = ps_expect_ident_or_keyword(s);
        s = prop_got.st;
        expr = mk_member_expr(expr, prop_got.value.value, true);
      }
    } else if (ps_check(s, "DOT")) {
      s = ps_advance(s).st;
      let prop_got = ps_expect_ident_or_keyword(s);
      s = prop_got.st;
      expr = mk_member_expr(expr, prop_got.value.value, false);
    } else if (ps_check(s, "LBRACKET")) {
      s = ps_advance(s).st;
      let idx_got = ps_parse_expr(s);
      s = idx_got.st;
      s = ps_expect(s, "RBRACKET").st;
      expr = mk_index_expr(expr, idx_got.value, false);
    } else if (ps_check(s, "LPAREN")) {
      s = ps_advance(s).st;
      let args_got = ps_parse_arg_list(s);
      s = args_got.st;
      s = ps_expect(s, "RPAREN").st;
      expr = mk_call_expr(expr, args_got.value, false);
    } else {
      looping = false;
    }
  }
  return ParseVal(s, expr);
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_arg_list = (st) => {
  let s = st;
  let args = [];
  while (!ps_check(s, "RPAREN") && !ps_is_eof(s)) {
    if (ps_check(s, "SPREAD")) {
      s = ps_advance(s).st;
      let arg_got = ps_parse_expr(s);
      s = arg_got.st;
      args = args.concat([{kind: "SpreadExpr", argument: arg_got.value}]);
    } else {
      let arg_got = ps_parse_expr(s);
      s = arg_got.st;
      args = args.concat([arg_got.value]);
    }
    s = ps_try_consume(s, "COMMA").st;
  }
  return ParseVal(s, args);
};

/**
 * @param {string} src
 * @returns {*}
 */
const parse_template_subexpr = (src) => {
  let sub_tokens = tokenize(src);
  let sub_st = ParserState(sub_tokens, 0, false, []);
  let got = ps_parse_expr(sub_st);
  return got.value;
};

/**
 * @param {string} raw
 * @returns {*}
 */
const ps_parse_template_lit = (raw) => {
  let inner = raw.slice(1, raw.length - 1);
  let quasis = [];
  let exprs = [];
  let i = 0;
  let done = false;
  while (i < inner.length && !done) {
    let dollar_idx = index_from(inner, "${", i);
    if (dollar_idx == -1) {
      quasis = quasis.concat([inner.slice(i)]);
      done = true;
    } else {
      quasis = quasis.concat([inner.slice(i, dollar_idx)]);
      let depth = 1;
      let j = dollar_idx + 2;
      while (j < inner.length && depth > 0) {
        if (inner[j] == "{") {
          depth = depth + 1;
        }
        if (inner[j] == "}") {
          depth = depth - 1;
        }
        j = j + 1;
      }
      let expr_str = inner.slice(dollar_idx + 2, j - 1);
      let sub_expr = parse_template_subexpr(expr_str);
      exprs = exprs.concat([sub_expr]);
      i = j;
    }
  }
  if (quasis.length == exprs.length) {
    quasis = quasis.concat([""]);
  }
  return {kind: "TemplateLit", raw: raw, quasis: quasis, exprs: exprs};
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_primary = (st) => {
  let tok = ps_peek(st);
  if (tok.type == "NUMBER") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "NumberLit", value: $parse_float(adv.value.value), raw: adv.value.value});
  } else if (tok.type == "STRING") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "StringLit", value: adv.value.value, raw: escape_js_string(adv.value.value)});
  } else if (tok.type == "TEMPLATE") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, ps_parse_template_lit(adv.value.value));
  } else if (tok.type == "KW_TRUE") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "BoolLit", value: true});
  } else if (tok.type == "KW_FALSE") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "BoolLit", value: false});
  } else if (tok.type == "REGEX") {
    let adv = ps_advance(st);
    let parts = regex_parts(adv.value.value);
    return ParseVal(adv.st, {kind: "RegexLit", pattern: parts.pattern, flags: parts.flags});
  } else if (tok.type == "KW_MATCH") {
    return ps_parse_match(st);
  } else if (tok.type == "KW_DO") {
    let adv = ps_advance(st);
    let s = adv.st;
    s = ps_expect(s, "LBRACE").st;
    let body_got = ps_parse_block_body(s, false);
    s = body_got.st;
    s = ps_expect(s, "RBRACE").st;
    let block_body = wrap_block_body(body_got.value, "ReturnStmt");
    return ParseVal(s, {kind: "DoExpr", body: block_body});
  } else if (tok.type == "KW_IF") {
    let if_got = ps_parse_if_stmt(st, false);
    return ParseVal(if_got.st, {kind: "BlockExpr", stmts: [if_got.value]});
  } else if (tok.type == "LBRACE") {
    return ps_parse_object_lit(st);
  } else if (tok.type == "LBRACKET") {
    return ps_parse_array_lit(st);
  } else if (tok.type == "LPAREN") {
    return ps_parse_paren_or_lambda(st);
  } else if (tok.type == "DOT") {
    return ps_parse_dot_lambda(st);
  } else if (tok.type == "KW_NEW") {
    let adv = ps_advance(st);
    let callee_got = ps_parse_postfix(adv.st);
    return ParseVal(callee_got.st, {kind: "NewExpr", callee: callee_got.value, args: []});
  } else if (tok.type == "IDENT") {
    if (!st.in_match_guard && ps_token_at(st, 1).type == "FAT_ARROW") {
      let param_adv = ps_advance(st);
      let arrow_adv = ps_advance(param_adv.st);
      let body_got = ps_parse_lambda_body(arrow_adv.st);
      return ParseVal(body_got.st, {kind: "LambdaExpr", params: [param_adv.value.value], body: body_got.value});
    } else {
      let adv = ps_advance(st);
      return ParseVal(adv.st, {kind: "Identifier", name: tok.value});
    }
  } else if (tok.type == "UNDERSCORE") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "Identifier", name: "_"});
  } else if (tok.type == "SPREAD") {
    let adv = ps_advance(st);
    let arg_got = ps_parse_expr(adv.st);
    return ParseVal(arg_got.st, {kind: "SpreadExpr", argument: arg_got.value});
  } else {
    let err = {severity: "error", message: "Unexpected token: " + tok.type, line: tok.line, col: tok.col};
    return ParseVal(ParserState(st.tokens, st.pos, st.in_match_guard, st.errors.concat([err])), {kind: "Identifier", name: "undefined"});
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_dot_lambda = (st) => {
  let adv = ps_advance(st);
  let s = adv.st;
  let field_got = ps_expect_ident_or_keyword(s);
  s = field_got.st;
  let body = mk_member_expr({kind: "Identifier", name: "__x"}, field_got.value.value, false);
  while (ps_check(s, "DOT")) {
    s = ps_advance(s).st;
    let sub_got = ps_expect_ident_or_keyword(s);
    s = sub_got.st;
    body = mk_member_expr(body, sub_got.value.value, false);
  }
  return ParseVal(s, {kind: "LambdaExpr", params: ["__x"], body: body});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_match = (st) => {
  let s = ps_expect(st, "KW_MATCH").st;
  let subj_got = ps_parse_postfix(s);
  s = subj_got.st;
  s = ps_expect(s, "LBRACE").st;
  let arms = [];
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    s = ps_expect(s, "PIPE").st;
    let pat_got = ps_parse_pattern(s);
    s = pat_got.st;
    let guard = null;
    if (ps_check(s, "KW_WHEN")) {
      s = ps_advance(s).st;
      s = ParserState(s.tokens, s.pos, true, s.errors);
      let guard_got = ps_parse_or(s);
      s = ParserState(guard_got.st.tokens, guard_got.st.pos, false, guard_got.st.errors);
      guard = guard_got.value;
    }
    s = ps_expect(s, "FAT_ARROW").st;
    let body_got = ps_parse_expr(s);
    s = body_got.st;
    arms = arms.concat([mk_match_arm(pat_got.value, guard, body_got.value)]);
    s = ps_try_consume(s, "COMMA").st;
  }
  s = ps_expect(s, "RBRACE").st;
  return ParseVal(s, {kind: "MatchExpr", subject: subj_got.value, arms: arms});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_pattern = (st) => {
  let tok = ps_peek(st);
  if (tok.type == "UNDERSCORE" || tok.type == "IDENT" && tok.value == "_") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "WildcardPat"});
  } else if (tok.type == "LT" || tok.type == "GT" || tok.type == "LTE" || tok.type == "GTE" || tok.type == "NEQ") {
    let op_adv = ps_advance(st);
    let val_tok = ps_peek(op_adv.st);
    if (val_tok.type == "NUMBER") {
      let v_adv = ps_advance(op_adv.st);
      return ParseVal(v_adv.st, {kind: "ComparePat", op: op_adv.value.value, value: $parse_float(v_adv.value.value)});
    } else if (val_tok.type == "STRING") {
      let v_adv = ps_advance(op_adv.st);
      return ParseVal(v_adv.st, {kind: "ComparePat", op: op_adv.value.value, value: v_adv.value.value});
    } else if (val_tok.type == "IDENT") {
      let v_adv = ps_advance(op_adv.st);
      return ParseVal(v_adv.st, {kind: "ComparePat", op: op_adv.value.value, value: v_adv.value.value});
    } else {
      return ParseVal(op_adv.st, {kind: "WildcardPat"});
    }
  } else if (tok.type == "KW_TRUE") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "LiteralPat", value: true});
  } else if (tok.type == "KW_FALSE") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "LiteralPat", value: false});
  } else if (tok.type == "NUMBER") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "LiteralPat", value: $parse_float(adv.value.value)});
  } else if (tok.type == "STRING") {
    let adv = ps_advance(st);
    return ParseVal(adv.st, {kind: "LiteralPat", value: adv.value.value});
  } else if (tok.type == "IDENT" && ps_token_at(st, 1).type == "DOT" && ps_token_at(st, 2).type == "IDENT") {
    let enum_adv = ps_advance(st);
    let s = enum_adv.st;
    s = ps_advance(s).st;
    let var_got = ps_expect(s, "IDENT");
    return ParseVal(var_got.st, {kind: "EnumPat", enumName: enum_adv.value.value, variant: var_got.value.value});
  } else if (tok.type == "IDENT") {
    let name_adv = ps_advance(st);
    let s = name_adv.st;
    if (ps_check(s, "LBRACE")) {
      s = ps_advance(s).st;
      let bindings = [];
      while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
        let b_got = ps_expect(s, "IDENT");
        s = b_got.st;
        bindings = bindings.concat([b_got.value.value]);
        s = ps_try_consume(s, "COMMA").st;
      }
      s = ps_expect(s, "RBRACE").st;
      return ParseVal(s, {kind: "TagPat", name: name_adv.value.value, bindings: bindings});
    } else {
      return ParseVal(s, {kind: "IdentPat", name: name_adv.value.value});
    }
  } else {
    return ParseVal(st, {kind: "WildcardPat"});
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_object_lit = (st) => {
  let s = ps_expect(st, "LBRACE").st;
  let properties = [];
  while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
    if (ps_check(s, "SPREAD")) {
      s = ps_advance(s).st;
      let arg_got = ps_parse_expr(s);
      s = arg_got.st;
      properties = properties.concat([{kind: "ObjectProperty", key: "_spread_", value: arg_got.value, spread: true}]);
      s = ps_try_consume(s, "COMMA").st;
    } else if (ps_check(s, "LBRACKET")) {
      s = ps_advance(s).st;
      let key_got = ps_parse_expr(s);
      s = key_got.st;
      s = ps_expect(s, "RBRACKET").st;
      s = ps_expect(s, "COLON").st;
      let val_got = ps_parse_expr(s);
      s = val_got.st;
      properties = properties.concat([{kind: "ObjectProperty", key: key_got.value, value: val_got.value, computed: true}]);
      s = ps_try_consume(s, "COMMA").st;
    } else {
      let key_tok = ps_peek(s);
      let key_got = (() => {
        if (key_tok.type == "IDENT" || key_tok.type == "STRING") {
          return ps_advance(s);
        } else if (key_tok.type == "KW_LET" || key_tok.type == "KW_FN") {
          return ps_advance(s);
        } else {
          return ps_advance(s);
        }
})();
      s = key_got.st;
      let key = key_got.value.value;
      if (ps_check(s, "COLON")) {
        s = ps_advance(s).st;
        let val_got = ps_parse_expr(s);
        s = val_got.st;
        properties = properties.concat([{kind: "ObjectProperty", key: key, value: val_got.value}]);
      } else {
        properties = properties.concat([{kind: "ObjectProperty", key: key, value: {kind: "Identifier", name: key}, shorthand: true}]);
      }
      s = ps_try_consume(s, "COMMA").st;
    }
  }
  s = ps_expect(s, "RBRACE").st;
  return ParseVal(s, {kind: "ObjectLit", properties: properties});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_array_lit = (st) => {
  let s = ps_expect(st, "LBRACKET").st;
  let elements = [];
  while (!ps_check(s, "RBRACKET") && !ps_is_eof(s)) {
    if (ps_check(s, "SPREAD")) {
      s = ps_advance(s).st;
      let arg_got = ps_parse_expr(s);
      s = arg_got.st;
      elements = elements.concat([{kind: "SpreadExpr", argument: arg_got.value}]);
    } else {
      let el_got = ps_parse_expr(s);
      s = el_got.st;
      elements = elements.concat([el_got.value]);
    }
    s = ps_try_consume(s, "COMMA").st;
  }
  s = ps_expect(s, "RBRACKET").st;
  return ParseVal(s, {kind: "ArrayLit", elements: elements});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_paren_or_lambda = (st) => {
  if (ps_is_lambda_ahead(st)) {
    return ps_parse_lambda_params(st);
  } else {
    let s = ps_expect(st, "LPAREN").st;
    let expr_got = ps_parse_expr(s);
    s = expr_got.st;
    s = ps_expect(s, "RPAREN").st;
    return ParseVal(s, expr_got.value);
  }
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_lambda_params = (st) => {
  let s = ps_advance(st).st;
  let params = [];
  while (!ps_check(s, "RPAREN") && !ps_is_eof(s)) {
    let spread_got = ps_try_consume(s, "SPREAD");
    s = spread_got.st;
    let spread = spread_got.value != null;
    if (ps_check(s, "LBRACKET")) {
      s = ps_advance(s).st;
      let names = [];
      while (!ps_check(s, "RBRACKET") && !ps_is_eof(s)) {
        let n_got = ps_expect(s, "IDENT");
        s = n_got.st;
        names = names.concat([n_got.value.value]);
        s = ps_try_consume(s, "COMMA").st;
      }
      s = ps_expect(s, "RBRACKET").st;
      params = params.concat([{name: "[" + join_strings(names, ", ") + "]", destructure: true}]);
      s = ps_try_consume(s, "COMMA").st;
    } else if (ps_check(s, "LBRACE")) {
      s = ps_advance(s).st;
      let names = [];
      while (!ps_check(s, "RBRACE") && !ps_is_eof(s)) {
        let n_got = ps_expect(s, "IDENT");
        s = n_got.st;
        names = names.concat([n_got.value.value]);
        s = ps_try_consume(s, "COMMA").st;
      }
      s = ps_expect(s, "RBRACE").st;
      params = params.concat([{name: "{ " + join_strings(names, ", ") + " }", destructure: true}]);
      s = ps_try_consume(s, "COMMA").st;
    } else {
      let nm_got = ps_expect(s, "IDENT");
      s = nm_got.st;
      if (ps_check(s, "COLON")) {
        s = ps_advance(s).st;
        let ty_got = ps_parse_type_expr(s);
        s = ty_got.st;
      }
      if (spread) {
        params = params.concat([{name: nm_got.value.value, destructure: true}]);
      } else {
        params = params.concat([nm_got.value.value]);
      }
      s = ps_try_consume(s, "COMMA").st;
    }
  }
  s = ps_expect(s, "RPAREN").st;
  s = ps_expect(s, "FAT_ARROW").st;
  let body_got = ps_parse_lambda_body(s);
  return ParseVal(body_got.st, {kind: "LambdaExpr", params: params, body: body_got.value});
};

/**
 * @param {ParserState} st
 * @returns {ParseVal}
 */
const ps_parse_lambda_body = (st) => {
  if (ps_check(st, "LBRACE")) {
    if (ps_is_object_lit_ahead(st)) {
      return ps_parse_object_lit(st);
    } else {
      let s = ps_advance(st).st;
      let body_got = ps_parse_block_body(s, false);
      s = body_got.st;
      s = ps_expect(s, "RBRACE").st;
      if (body_got.value.kind != "BlockExpr") {
        return ParseVal(s, {kind: "BlockExpr", stmts: [{kind: "ReturnStmt", value: body_got.value}]});
      } else {
        return ParseVal(s, body_got.value);
      }
    }
  } else {
    return ps_parse_expr(st);
  }
};

/**
 * @param {Token} tokens
 * @returns {Program}
 */
const parse = (tokens) => {
  let st = ParserState(tokens, 0, false, []);
  return ps_parse(st).value;
};



// ─── checker.syn ───────────────────────────────────────


const ChkState = (diagnostics, unions, purity_fn, purity_line, purity_on, exhaustive_fn, exhaustive_line, exhaustive_on, throws_fn, throws_line, throws_on, throws_ok, throws_err) => ({ diagnostics, unions, purity_fn, purity_line, purity_on, exhaustive_fn, exhaustive_line, exhaustive_on, throws_fn, throws_line, throws_on, throws_ok, throws_err });

/**
 * @param {ChkState} st
 * @param {string} message
 * @param {number} line
 * @returns {ChkState}
 */
const chk_warn = (st, message, line) => {
  let d = {severity: "warning", message: message, line: line};
  return ChkState(st.diagnostics.concat([d]), st.unions, st.purity_fn, st.purity_line, st.purity_on, st.exhaustive_fn, st.exhaustive_line, st.exhaustive_on, st.throws_fn, st.throws_line, st.throws_on, st.throws_ok, st.throws_err);
};

/**
 * @param {*} arr
 * @param {string} item
 * @returns {boolean}
 */
const arr_has = (arr, item) => {
  let i = 0;
  while (i < arr.length) {
    if (arr[i] == item) {
      return true;
    }
    i = i + 1;
  }
  return false;
};

/**
 * @param {*} anns
 * @param {string} name
 * @returns {boolean}
 */
const has_annotation = (anns, name) => {
  let i = 0;
  while (i < anns.length) {
    if (anns[i].name == name) {
      return true;
    }
    i = i + 1;
  }
  return false;
};

/**
 * @param {string} s
 * @param {string} sub
 * @returns {number}
 */
const str_index_of = (s, sub) => {
  let i = 0;
  while (i <= s.length - sub.length) {
    if (s.slice(i, i + sub.length) == sub) {
      return i;
    }
    i = i + 1;
  }
  return -1;
};

/**
 * @param {string} s
 * @param {string} sub
 * @returns {boolean}
 */
const str_contains = (s, sub) => str_index_of(s, sub) >= 0;

/**
 * @param {string} c
 * @returns {string}
 */
const char_to_lower = (c) => {
  if (c == "A") {
    return "a";
  } else if (c == "B") {
    return "b";
  } else if (c == "C") {
    return "c";
  } else if (c == "D") {
    return "d";
  } else if (c == "E") {
    return "e";
  } else if (c == "F") {
    return "f";
  } else if (c == "G") {
    return "g";
  } else if (c == "H") {
    return "h";
  } else if (c == "I") {
    return "i";
  } else if (c == "J") {
    return "j";
  } else if (c == "K") {
    return "k";
  } else if (c == "L") {
    return "l";
  } else if (c == "M") {
    return "m";
  } else if (c == "N") {
    return "n";
  } else if (c == "O") {
    return "o";
  } else if (c == "P") {
    return "p";
  } else if (c == "Q") {
    return "q";
  } else if (c == "R") {
    return "r";
  } else if (c == "S") {
    return "s";
  } else if (c == "T") {
    return "t";
  } else if (c == "U") {
    return "u";
  } else if (c == "V") {
    return "v";
  } else if (c == "W") {
    return "w";
  } else if (c == "X") {
    return "x";
  } else if (c == "Y") {
    return "y";
  } else if (c == "Z") {
    return "z";
  } else {
    return c;
  }
};

/**
 * @param {string} s
 * @returns {string}
 */
const str_to_lower = (s) => {
  let out = "";
  let i = 0;
  while (i < s.length) {
    out = out + char_to_lower(s.slice(i, i + 1));
    i = i + 1;
  }
  return out;
};

/**
 * @param {string} name
 * @returns {boolean}
 */
const starts_with_upper = (name) => {
  if (name.length == 0) {
    return false;
  } else {
    let c = name.slice(0, 1);
    return c >= "A" && c <= "Z";
  }
};

/**
 * @param {string} name
 * @returns {boolean}
 */
const looks_like_bool_name = (name) => {
  let lower = str_to_lower(name);
  if (lower == "state") {
    return true;
  } else if (str_contains(lower, "bool")) {
    return true;
  } else if (str_contains(lower, "flag")) {
    return true;
  } else if (str_contains(lower, "is")) {
    return true;
  } else if (str_contains(lower, "has")) {
    return true;
  } else if (str_contains(lower, "can")) {
    return true;
  } else if (str_contains(lower, "dark")) {
    return true;
  } else if (str_contains(lower, "open")) {
    return true;
  } else if (str_contains(lower, "valid")) {
    return true;
  } else if (str_contains(lower, "active")) {
    return true;
  } else if (str_contains(lower, "enabled")) {
    return true;
  } else {
    return false;
  }
};

/**
 * @param {*} expr
 * @returns {boolean}
 */
const looks_like_bool = (expr) => {
  if (expr.kind == "BoolLit") {
    return true;
  } else if (expr.kind == "Identifier") {
    return looks_like_bool_name(expr.name);
  } else {
    return false;
  }
};

/**
 * @param {*} decl
 * @returns {string}
 */
const union_variant_names = (decl) => {
  let names = [];
  let i = 0;
  while (i < decl.variants.length) {
    names = names.concat([decl.variants[i].name]);
    i = i + 1;
  }
  return names;
};

/**
 * @param {ChkState} st
 * @param {Program} program
 * @returns {ChkState}
 */
const collect_unions = (st, program) => {
  let s = st;
  let i = 0;
  while (i < program.body.length) {
    let decl = program.body[i];
    if (decl.kind == "TaggedUnionDecl") {
      let info = {name: decl.name, variants: union_variant_names(decl)};
      s = ChkState(s.diagnostics, s.unions.concat([info]), s.purity_fn, s.purity_line, s.purity_on, s.exhaustive_fn, s.exhaustive_line, s.exhaustive_on, s.throws_fn, s.throws_line, s.throws_on, s.throws_ok, s.throws_err);
    } else if (decl.kind == "ExportDecl" && decl.decl.kind == "TaggedUnionDecl") {
      let u = decl.decl;
      let info = {name: u.name, variants: union_variant_names(u)};
      s = ChkState(s.diagnostics, s.unions.concat([info]), s.purity_fn, s.purity_line, s.purity_on, s.exhaustive_fn, s.exhaustive_line, s.exhaustive_on, s.throws_fn, s.throws_line, s.throws_on, s.throws_ok, s.throws_err);
    }
    i = i + 1;
  }
  return s;
};

/**
 * @param {string} name
 * @returns {boolean}
 */
const is_effectful_global = (name) => {
  if (name == "document") {
    return true;
  } else if (name == "window") {
    return true;
  } else if (name == "console") {
    return true;
  } else if (name == "fetch") {
    return true;
  } else if (name == "XMLHttpRequest") {
    return true;
  } else if (name == "setTimeout") {
    return true;
  } else if (name == "setInterval") {
    return true;
  } else if (name == "clearTimeout") {
    return true;
  } else if (name == "clearInterval") {
    return true;
  } else if (name == "localStorage") {
    return true;
  } else if (name == "sessionStorage") {
    return true;
  } else if (name == "indexedDB") {
    return true;
  } else if (name == "alert") {
    return true;
  } else if (name == "confirm") {
    return true;
  } else if (name == "prompt") {
    return true;
  } else {
    return false;
  }
};

/**
 * @param {string} prop
 * @returns {boolean}
 */
const is_effectful_method = (prop) => {
  if (prop == "log") {
    return true;
  } else if (prop == "warn") {
    return true;
  } else if (prop == "error") {
    return true;
  } else if (prop == "info") {
    return true;
  } else if (prop == "getElementById") {
    return true;
  } else if (prop == "querySelector") {
    return true;
  } else if (prop == "querySelectorAll") {
    return true;
  } else if (prop == "createElement") {
    return true;
  } else if (prop == "appendChild") {
    return true;
  } else if (prop == "removeChild") {
    return true;
  } else if (prop == "insertBefore") {
    return true;
  } else if (prop == "addEventListener") {
    return true;
  } else if (prop == "removeEventListener") {
    return true;
  } else if (prop == "setAttribute") {
    return true;
  } else if (prop == "removeAttribute") {
    return true;
  } else if (prop == "push") {
    return true;
  } else if (prop == "pop") {
    return true;
  } else if (prop == "shift") {
    return true;
  } else if (prop == "unshift") {
    return true;
  } else if (prop == "splice") {
    return true;
  } else if (prop == "sort") {
    return true;
  } else if (prop == "reverse") {
    return true;
  } else if (prop == "write") {
    return true;
  } else if (prop == "writeln") {
    return true;
  } else {
    return false;
  }
};

/**
 * @param {ChkState} st
 * @param {*} e
 * @returns {ChkState}
 */
const chk_visit_purity = (st, e) => {
  if (!st.purity_on) {
    return st;
  } else {
    let s = st;
    if (e.kind == "Identifier" && is_effectful_global(e.name)) {
      s = chk_warn(s, "@pure function '" + s.purity_fn + "' references effectful global '" + e.name + "'", s.purity_line);
    }
    if (e.kind == "MemberExpr") {
      if (e.object.kind == "Identifier" && is_effectful_global(e.object.name)) {
        s = chk_warn(s, "@pure function '" + s.purity_fn + "' accesses effectful global '" + e.object.name + "." + e.property + "'", s.purity_line);
      }
      if (e.object.kind == "Identifier" && e.object.name == "Math" && e.property == "random") {
        s = chk_warn(s, "@pure function '" + s.purity_fn + "' calls Math.random which is non-deterministic", s.purity_line);
      }
      if (is_effectful_method(e.property)) {
        s = chk_warn(s, "@pure function '" + s.purity_fn + "' calls potentially effectful method '." + e.property + "()'", s.purity_line);
      }
    }
    return s;
  }
};

/**
 * @param {ChkState} st
 * @param {*} e
 * @returns {ChkState}
 */
const chk_visit_throws = (st, e) => {
  if (!st.throws_on) {
    return st;
  } else if (e.kind == "CallExpr" && e.callee.kind == "Identifier") {
    if (e.callee.name == "ok") {
      return ChkState(st.diagnostics, st.unions, st.purity_fn, st.purity_line, st.purity_on, st.exhaustive_fn, st.exhaustive_line, st.exhaustive_on, st.throws_fn, st.throws_line, st.throws_on, true, st.throws_err);
    } else if (e.callee.name == "err") {
      return ChkState(st.diagnostics, st.unions, st.purity_fn, st.purity_line, st.purity_on, st.exhaustive_fn, st.exhaustive_line, st.exhaustive_on, st.throws_fn, st.throws_line, st.throws_on, st.throws_ok, true);
    } else {
      return st;
    }
  } else {
    return st;
  }
};

/**
 * @param {ChkState} st
 * @param {*} e
 * @returns {ChkState}
 */
const chk_visit_expr = (st, e) => {
  let s = chk_visit_purity(st, e);
  if (s.exhaustive_on && e.kind == "MatchExpr") {
    s = chk_match_exhaustive(s, e, s.exhaustive_fn, s.exhaustive_line);
  }
  return chk_visit_throws(s, e);
};

/**
 * @param {ChkState} st
 * @param {*} expr
 * @returns {ChkState}
 */
const walk_expr = (st, expr) => {
  let s = chk_visit_expr(st, expr);
  let k = expr.kind;
  if (k == "BinaryExpr") {
    s = walk_expr(s, expr.left);
    return walk_expr(s, expr.right);
  } else if (k == "UnaryExpr") {
    return walk_expr(s, expr.operand);
  } else if (k == "TernaryExpr") {
    s = walk_expr(s, expr.test);
    s = walk_expr(s, expr.consequent);
    return walk_expr(s, expr.alternate);
  } else if (k == "CallExpr") {
    s = walk_expr(s, expr.callee);
    let i = 0;
    while (i < expr.args.length) {
      s = walk_expr(s, expr.args[i]);
      i = i + 1;
    }
    return s;
  } else if (k == "NewExpr") {
    s = walk_expr(s, expr.callee);
    let i = 0;
    while (i < expr.args.length) {
      s = walk_expr(s, expr.args[i]);
      i = i + 1;
    }
    return s;
  } else if (k == "MemberExpr") {
    return walk_expr(s, expr.object);
  } else if (k == "IndexExpr") {
    s = walk_expr(s, expr.object);
    return walk_expr(s, expr.index);
  } else if (k == "SpreadExpr") {
    return walk_expr(s, expr.argument);
  } else if (k == "ObjectLit") {
    let i = 0;
    while (i < expr.properties.length) {
      s = walk_expr(s, expr.properties[i].value);
      i = i + 1;
    }
    return s;
  } else if (k == "ArrayLit") {
    let i = 0;
    while (i < expr.elements.length) {
      s = walk_expr(s, expr.elements[i]);
      i = i + 1;
    }
    return s;
  } else if (k == "LambdaExpr") {
    return walk_expr(s, expr.body);
  } else if (k == "PipelineExpr") {
    let i = 0;
    while (i < expr.steps.length) {
      let step = expr.steps[i];
      if (step.kind != "PipeAs") {
        s = walk_expr(s, step);
      }
      i = i + 1;
    }
    return s;
  } else if (k == "MatchExpr") {
    s = walk_expr(s, expr.subject);
    let i = 0;
    while (i < expr.arms.length) {
      let arm = expr.arms[i];
      if (arm.guard != null) {
        s = walk_expr(s, arm.guard);
      }
      s = walk_expr(s, arm.body);
      i = i + 1;
    }
    return s;
  } else if (k == "BlockExpr") {
    return walk_block(s, expr);
  } else if (k == "ResultPropagateExpr") {
    return walk_expr(s, expr.value);
  } else if (k == "AwaitExpr") {
    return walk_expr(s, expr.value);
  } else {
    return s;
  }
};

/**
 * @param {ChkState} st
 * @param {*} block
 * @returns {ChkState}
 */
const walk_block = (st, block) => {
  let s = st;
  let i = 0;
  while (i < block.stmts.length) {
    let stmt = block.stmts[i];
    let sk = stmt.kind;
    if (sk == "LetStmt") {
      if (stmt.value != null) {
        s = walk_expr(s, stmt.value);
      }
    } else if (sk == "DestructureStmt") {
      s = walk_expr(s, stmt.value);
    } else if (sk == "ReturnStmt") {
      s = walk_expr(s, stmt.value);
    } else if (sk == "ExprStmt") {
      s = walk_expr(s, stmt.value);
    } else if (sk == "IfStmt") {
      s = walk_expr(s, stmt.test);
      s = walk_block(s, stmt.then);
      if (stmt.else_ != null) {
        s = walk_block(s, stmt.else_);
      }
    } else if (sk == "ForRangeStmt") {
      s = walk_expr(s, stmt.lo);
      s = walk_expr(s, stmt.hi);
      s = walk_block(s, stmt.body);
    } else if (sk == "ForInStmt") {
      s = walk_expr(s, stmt.iter);
      s = walk_block(s, stmt.body);
    } else if (sk == "BreakStmt") {
      s;
    } else if (sk == "ContinueStmt") {
      s;
    } else if (sk == "RefineStmt") {
      s;
    } else {
      s;
    }
    i = i + 1;
  }
  return s;
};

/**
 * @param {*} pat
 * @returns {boolean}
 */
const arm_has_wildcard = (pat) => {
  if (pat.kind == "WildcardPat") {
    return true;
  } else if (pat.kind == "IdentPat" && !starts_with_upper(pat.name)) {
    return true;
  } else {
    return false;
  }
};

/**
 * @param {*} arms
 * @returns {boolean}
 */
const arms_have_wildcard = (arms) => {
  let i = 0;
  while (i < arms.length) {
    if (arm_has_wildcard(arms[i].pattern)) {
      return true;
    }
    i = i + 1;
  }
  return false;
};

/**
 * @param {*} arms
 * @param {boolean} value
 * @returns {boolean}
 */
const arms_have_bool_lit = (arms, value) => {
  let i = 0;
  while (i < arms.length) {
    let p = arms[i].pattern;
    if (p.kind == "LiteralPat" && p.value == value) {
      return true;
    }
    i = i + 1;
  }
  return false;
};

/**
 * @param {*} arms
 * @returns {boolean}
 */
const arms_have_compare = (arms) => {
  let i = 0;
  while (i < arms.length) {
    if (arms[i].pattern.kind == "ComparePat") {
      return true;
    }
    i = i + 1;
  }
  return false;
};

/**
 * @param {*} pat
 * @returns {string}
 */
const tag_pattern_name = (pat) => {
  if (pat.kind == "TagPat") {
    return pat.name;
  } else if (pat.kind == "IdentPat") {
    return pat.name;
  } else {
    return "";
  }
};

/**
 * @param {*} pat
 * @returns {boolean}
 */
const is_tag_pattern = (pat) => {
  if (pat.kind == "TagPat") {
    return true;
  } else if (pat.kind == "IdentPat" && starts_with_upper(pat.name)) {
    return true;
  } else {
    return false;
  }
};

/**
 * @param {*} arms
 * @returns {string}
 */
const collect_tag_names = (arms) => {
  let names = [];
  let i = 0;
  while (i < arms.length) {
    let p = arms[i].pattern;
    if (is_tag_pattern(p)) {
      names = names.concat([tag_pattern_name(p)]);
    }
    i = i + 1;
  }
  return names;
};

/**
 * @param {string} covered
 * @param {string} variants
 * @returns {boolean}
 */
const set_has_all_variants = (covered, variants) => {
  let i = 0;
  while (i < variants.length) {
    if (!arr_has(covered, variants[i])) {
      return false;
    }
    i = i + 1;
  }
  return true;
};

/**
 * @param {string} covered
 * @param {string} variants
 * @returns {boolean}
 */
const set_overlaps_union = (covered, variants) => {
  let i = 0;
  while (i < covered.length) {
    if (arr_has(variants, covered[i])) {
      return true;
    }
    i = i + 1;
  }
  return false;
};

/**
 * @param {ChkState} st
 * @param {*} e
 * @param {string} fn_name
 * @param {number} fn_line
 * @returns {ChkState}
 */
const chk_match_exhaustive = (st, e, fn_name, fn_line) => {
  let arms = e.arms;
  if (arms_have_wildcard(arms)) {
    return st;
  } else if (looks_like_bool(e.subject)) {
    let has_true = arms_have_bool_lit(arms, true);
    let has_false = arms_have_bool_lit(arms, false);
    if (has_true && has_false) {
      return st;
    } else {
      let missing = (() => {
        if (has_true) {
          return "false";
        } else {
          return "true";
        }
})();
      return chk_warn(st, "@exhaustive function '" + fn_name + "': match on boolean missing case for '" + missing + "'", fn_line);
    }
  } else {
    let covered = collect_tag_names(arms);
    if (covered.length > 0) {
      let s = st;
      let ui = 0;
      while (ui < s.unions.length) {
        let info = s.unions[ui];
        if (set_overlaps_union(covered, info.variants)) {
          let vi = 0;
          while (vi < info.variants.length) {
            let variant = info.variants[vi];
            if (!arr_has(covered, variant)) {
              s = chk_warn(s, "@exhaustive function '" + fn_name + "': match on union missing case for '" + variant + "'", fn_line);
            }
            vi = vi + 1;
          }
        }
        ui = ui + 1;
      }
      return s;
    } else if (arms_have_compare(arms)) {
      return st;
    } else {
      return chk_warn(st, "@exhaustive function '" + fn_name + "': match has no wildcard '_' — may not cover all cases", fn_line);
    }
  }
};

/**
 * @param {ChkState} st
 * @param {*} expr
 * @param {string} fn_name
 * @param {number} fn_line
 * @returns {ChkState}
 */
const check_exhaustive_body = (st, expr, fn_name, fn_line) => {
  let active = ChkState(st.diagnostics, st.unions, st.purity_fn, st.purity_line, st.purity_on, fn_name, fn_line, true, st.throws_fn, st.throws_line, st.throws_on, st.throws_ok, st.throws_err);
  return walk_expr(active, expr);
};

/**
 * @param {ChkState} st
 * @param {*} expr
 * @param {string} fn_name
 * @param {number} fn_line
 * @returns {ChkState}
 */
const check_purity = (st, expr, fn_name, fn_line) => {
  let active = ChkState(st.diagnostics, st.unions, fn_name, fn_line, true, st.exhaustive_fn, st.exhaustive_line, st.exhaustive_on, st.throws_fn, st.throws_line, st.throws_on, st.throws_ok, st.throws_err);
  return walk_expr(active, expr);
};

/**
 * @param {ChkState} st
 * @param {*} expr
 * @param {string} fn_name
 * @param {number} fn_line
 * @returns {ChkState}
 */
const check_throws = (st, expr, fn_name, fn_line) => {
  let active = ChkState(st.diagnostics, st.unions, st.purity_fn, st.purity_line, st.purity_on, st.exhaustive_fn, st.exhaustive_line, st.exhaustive_on, fn_name, fn_line, true, false, false);
  let walked = walk_expr(active, expr);
  if (walked.throws_ok || walked.throws_err) {
    return walked;
  } else {
    return chk_warn(walked, "@throws function '" + fn_name + "' never calls ok() or err()", fn_line);
  }
};

/**
 * @param {ChkState} st
 * @param {*} fndecl
 * @returns {ChkState}
 */
const check_fn = (st, fndecl) => {
  let s = st;
  if (has_annotation(fndecl.annotations, "pure")) {
    s = check_purity(s, fndecl.body, fndecl.name, fndecl.line);
  }
  if (has_annotation(fndecl.annotations, "exhaustive")) {
    s = check_exhaustive_body(s, fndecl.body, fndecl.name, fndecl.line);
  }
  if (has_annotation(fndecl.annotations, "throws")) {
    s = check_throws(s, fndecl.body, fndecl.name, fndecl.line);
  }
  return s;
};

/**
 * @param {ChkState} st
 * @param {*} fndecl
 * @returns {ChkState}
 */
const check_async_effects = (st, fndecl) => {
  if (has_annotation(fndecl.annotations, "effects")) {
    return st;
  } else {
    return chk_warn(st, "async fn '" + fndecl.name + "' should declare @effects to document its async operations (e.g. @effects [\"network\"] or @effects [\"timer\"])", fndecl.line);
  }
};

/**
 * @param {ChkState} st
 * @param {*} decl
 * @returns {ChkState}
 */
const check_test = (st, decl) => {
  if (decl.body.kind == "BoolLit" && decl.body.value == false) {
    return chk_warn(st, "@test \"" + decl.description + "\" has a trivially false assertion", decl.line);
  } else {
    return st;
  }
};

/**
 * @param {ChkState} st
 * @param {*} decl
 * @returns {ChkState}
 */
const check_top_level = (st, decl) => {
  let s = st;
  if (decl.kind == "FnDecl") {
    s = check_fn(s, decl);
    if (decl.isAsync) {
      s = check_async_effects(s, decl);
    }
  } else if (decl.kind == "ModuleDecl") {
    let i = 0;
    while (i < decl.body.length) {
      s = check_top_level(s, decl.body[i]);
      i = i + 1;
    }
  } else if (decl.kind == "TestDecl") {
    s = check_test(s, decl);
  } else if (decl.kind == "ExportDecl") {
    s = check_top_level(s, decl.decl);
  } else {
    s;
  }
  return s;
};

/**
 * @param {Program} program
 * @returns {*}
 */
const check = (program) => {
  let st = ChkState([], [], "", 0, false, "", 0, false, "", 0, false, false, false);
  st = collect_unions(st, program);
  let i = 0;
  while (i < program.body.length) {
    st = check_top_level(st, program.body[i]);
    i = i + 1;
  }
  return st.diagnostics;
};



// ─── codegen.syn ───────────────────────────────────────


const CgState = (lines, indent, scopes) => ({ lines, indent, scopes });

/**
 * @param {string} parts
 * @param {string} sep
 * @returns {string}
 */
const cg_join_strings = (parts, sep) => {
  let result = "";
  let i = 0;
  while (i < parts.length) {
    if (i > 0) {
      result = result + sep;
    }
    result = result + parts[i];
    i = i + 1;
  }
  return result;
};

/**
 * @param {number} n
 * @returns {string}
 */
const pad_indent = (n) => {
  let s = "";
  let i = 0;
  while (i < n) {
    s = s + "  ";
    i = i + 1;
  }
  return s;
};

/**
 * @param {CgState} st
 * @param {string} line
 * @returns {CgState}
 */
const cg_emit_line = (st, line) => CgState(st.lines.concat([pad_indent(st.indent) + line + "\n"]), st.indent, st.scopes);

/**
 * @param {CgState} st
 * @returns {CgState}
 */
const cg_emit_blank = (st) => cg_emit_line(st, "");

/**
 * @param {CgState} st
 * @returns {CgState}
 */
const cg_push_scope = (st) => CgState(st.lines, st.indent, st.scopes.concat([[]]));

/**
 * @param {CgState} st
 * @returns {CgState}
 */
const cg_pop_scope = (st) => {
  if (st.scopes.length <= 1) {
    return st;
  } else {
    return CgState(st.lines, st.indent, st.scopes.slice(0, st.scopes.length - 1));
  }
};

/**
 * @param {CgState} st
 * @param {string} name
 * @returns {CgState}
 */
const cg_declare = (st, name) => {
  let cur = st.scopes[st.scopes.length - 1];
  let next_scope = cur.concat([name]);
  let ss = st.scopes.slice(0, st.scopes.length - 1);
  ss = ss.concat([next_scope]);
  return CgState(st.lines, st.indent, ss);
};

/**
 * @param {CgState} st
 * @param {string} name
 * @returns {boolean}
 */
const cg_is_local = (st, name) => {
  let i = st.scopes.length - 1;
  while (i >= 0) {
    let scope = st.scopes[i];
    let j = 0;
    while (j < scope.length) {
      if (scope[j] == name) {
        return true;
      }
      j = j + 1;
    }
    i = i - 1;
  }
  return false;
};

/**
 * @param {*} ty
 * @returns {string}
 */
const cg_type_to_js = (ty) => {
  if (ty == null) {
    return "any";
  }
  let n = ty.name;
  if (n == "int") {
    return "number";
  } else if (n == "float") {
    return "number";
  } else if (n == "string") {
    return "string";
  } else if (n == "bool") {
    return "boolean";
  } else if (n == "void") {
    return "void";
  } else if (n == "any") {
    return "*";
  } else {
    return n;
  }
};

/**
 * @param {*} decl
 * @returns {boolean}
 */
const is_block_decl = (decl) => {
  let k = decl.kind;
  if (k == "FnDecl") {
    return true;
  } else if (k == "StoreDecl") {
    return true;
  } else if (k == "RecordDecl") {
    return true;
  } else if (k == "TaggedUnionDecl") {
    return true;
  } else if (k == "TestDecl") {
    return true;
  } else if (k == "ModuleDecl") {
    return true;
  } else if (k == "EnumDecl") {
    return true;
  } else if (k == "InterfaceDecl") {
    return true;
  } else if (k == "ExportDecl") {
    return is_block_decl(decl.decl);
  } else {
    return false;
  }
};

/**
 * @param {string} op
 * @returns {string}
 */
const binop_js = (op) => {
  if (op == "and") {
    return "&&";
  } else if (op == "or") {
    return "||";
  } else if (op == "not") {
    return "!";
  } else {
    return op;
  }
};

/**
 * @param {string} op
 * @returns {number}
 */
const precedence = (op) => {
  if (op == "||") {
    return 1;
  } else if (op == "&&") {
    return 2;
  } else if (op == "==") {
    return 3;
  } else if (op == "!=") {
    return 3;
  } else if (op == "===") {
    return 3;
  } else if (op == "!==") {
    return 3;
  } else if (op == "<") {
    return 4;
  } else if (op == ">") {
    return 4;
  } else if (op == "<=") {
    return 4;
  } else if (op == ">=") {
    return 4;
  } else if (op == "+") {
    return 5;
  } else if (op == "-") {
    return 5;
  } else if (op == "*") {
    return 6;
  } else if (op == "/") {
    return 6;
  } else if (op == "%") {
    return 6;
  } else {
    return 10;
  }
};

/**
 * @param {*} expr
 * @param {string} s
 * @returns {string}
 */
const cg_arrow_body_wrap = (expr, s) => {
  if (expr.kind == "ObjectLit") {
    return "(" + s + ")";
  } else {
    return s;
  }
};

/**
 * @param {string} name
 * @returns {boolean}
 */
const is_stdlib_name = (name) => {
  if (name == "map") {
    return true;
  } else if (name == "filter") {
    return true;
  } else if (name == "fold") {
    return true;
  } else if (name == "pipe") {
    return true;
  } else if (name == "zip") {
    return true;
  } else if (name == "range") {
    return true;
  } else if (name == "first") {
    return true;
  } else if (name == "last") {
    return true;
  } else if (name == "sum") {
    return true;
  } else if (name == "count") {
    return true;
  } else if (name == "any") {
    return true;
  } else if (name == "all") {
    return true;
  } else if (name == "flat") {
    return true;
  } else if (name == "flat_map") {
    return true;
  } else if (name == "sort_by") {
    return true;
  } else if (name == "sort_by_desc") {
    return true;
  } else if (name == "find") {
    return true;
  } else if (name == "find_index") {
    return true;
  } else if (name == "trim") {
    return true;
  } else if (name == "split") {
    return true;
  } else if (name == "starts_with") {
    return true;
  } else if (name == "ends_with") {
    return true;
  } else if (name == "contains") {
    return true;
  } else if (name == "to_upper") {
    return true;
  } else if (name == "to_lower") {
    return true;
  } else if (name == "replace_all") {
    return true;
  } else if (name == "pad_start") {
    return true;
  } else if (name == "pad_end") {
    return true;
  } else if (name == "min") {
    return true;
  } else if (name == "max") {
    return true;
  } else if (name == "min_by") {
    return true;
  } else if (name == "max_by") {
    return true;
  } else if (name == "take") {
    return true;
  } else if (name == "drop") {
    return true;
  } else if (name == "uniq") {
    return true;
  } else if (name == "chunk") {
    return true;
  } else if (name == "set_at") {
    return true;
  } else if (name == "reverse") {
    return true;
  } else if (name == "sum_by") {
    return true;
  } else if (name == "clamp") {
    return true;
  } else if (name == "abs") {
    return true;
  } else if (name == "round") {
    return true;
  } else if (name == "floor") {
    return true;
  } else if (name == "ceil") {
    return true;
  } else if (name == "pow") {
    return true;
  } else if (name == "sqrt") {
    return true;
  } else if (name == "random") {
    return true;
  } else if (name == "random_int") {
    return true;
  } else if (name == "parse_int") {
    return true;
  } else if (name == "parse_float") {
    return true;
  } else if (name == "ok") {
    return true;
  } else if (name == "err") {
    return true;
  } else if (name == "is_ok") {
    return true;
  } else if (name == "is_err") {
    return true;
  } else if (name == "unwrap") {
    return true;
  } else if (name == "unwrap_or") {
    return true;
  } else if (name == "delay") {
    return true;
  } else if (name == "println") {
    return true;
  } else {
    return false;
  }
};

/**
 * @param {string} prop
 * @returns {boolean}
 */
const is_stdlib_method = (prop) => is_stdlib_name(prop);

/**
 * @param {CgState} st
 * @param {string} name
 * @returns {string}
 */
const cg_emit_name = (st, name) => {
  if (cg_is_local(st, name)) {
    return name;
  } else if (is_stdlib_name(name)) {
    return "$" + name;
  } else {
    return name;
  }
};

/**
 * @param {*} v
 * @returns {boolean}
 */
const is_string_value = (v) => {
  if (v == true) {
    return false;
  } else if (v == false) {
    return false;
  } else if (v == 0) {
    return false;
  } else if (v == 1) {
    return false;
  } else if (v == 2) {
    return false;
  } else if (v == 3) {
    return false;
  } else if (v == 4) {
    return false;
  } else if (v == 5) {
    return false;
  } else {
    return true;
  }
};

/**
 * @param {*} p
 * @returns {string}
 */
const lambda_param_name = (p) => {
  if (p.name != null) {
    return p.name;
  } else {
    return p;
  }
};

/**
 * @param {*} pat
 * @param {string} subj
 * @returns {string}
 */
const cg_pattern_condition = (pat, subj) => {
  let k = pat.kind;
  if (k == "WildcardPat") {
    return "true";
  } else if (k == "LiteralPat") {
    if (is_string_value(pat.value)) {
      return subj + " === \"" + pat.value + "\"";
    } else {
      return subj + " === " + pat.value;
    }
  } else if (k == "ComparePat") {
    if (is_string_value(pat.value)) {
      return subj + " " + pat.op + " \"" + pat.value + "\"";
    } else {
      return subj + " " + pat.op + " " + pat.value;
    }
  } else if (k == "IdentPat") {
    return "true";
  } else if (k == "TagPat") {
    return subj + ".tag === \"" + pat.name + "\"";
  } else if (k == "EnumPat") {
    return subj + " === " + pat.enumName + "." + pat.variant;
  } else {
    return "true";
  }
};

/**
 * @param {string} name
 * @returns {boolean}
 */
const ident_is_binding = (name) => {
  if (name == "_") {
    return false;
  } else if (name.length == 0) {
    return false;
  } else {
    let c = name.slice(0, 1);
    return c >= "a" && c <= "z";
  }
};

/**
 * @param {CgState} st
 * @param {*} arms
 * @param {number} idx
 * @param {string} subj_var
 * @returns {string}
 */
const cg_match_chain = (st, arms, idx, subj_var) => {
  if (idx >= arms.length) {
    return "undefined";
  } else {
    let arm = arms[idx];
    let rest = cg_match_chain(st, arms, idx + 1, subj_var);
    let pat = arm.pattern;
    if (pat.kind == "IdentPat" && ident_is_binding(pat.name)) {
      let name = pat.name;
      let s = cg_push_scope(st);
      s = cg_declare(s, name);
      let raw_body = cg_emit_expr(s, arm.body);
      s = cg_pop_scope(s);
      if (arm.guard != null) {
        let g = cg_emit_expr(st, arm.guard);
        return "((" + name + ") => (" + g + ") ? " + raw_body + " : " + rest + ")(" + subj_var + ")";
      } else {
        return "((" + name + ") => " + raw_body + ")(" + subj_var + ")";
      }
    } else if (pat.kind == "TagPat" && pat.bindings != null && pat.bindings.length > 0) {
      let cond = cg_pattern_condition(pat, subj_var);
      let bind_str = "";
      let bi = 0;
      while (bi < pat.bindings.length) {
        if (bi > 0) {
          bind_str = bind_str + ", ";
        }
        bind_str = bind_str + pat.bindings[bi];
        bi = bi + 1;
      }
      let s = cg_push_scope(st);
      bi = 0;
      while (bi < pat.bindings.length) {
        s = cg_declare(s, pat.bindings[bi]);
        bi = bi + 1;
      }
      let raw_body = cg_emit_expr(s, arm.body);
      s = cg_pop_scope(s);
      let inner = (() => {
        if (arm.guard != null) {
          let g = cg_emit_expr(st, arm.guard);
          return "(({ " + bind_str + " }) => (" + g + ") ? " + raw_body + " : " + rest + ")(" + subj_var + ")";
        } else {
          return "(({ " + bind_str + " }) => " + raw_body + ")(" + subj_var + ")";
        }
})();
      return "(" + cond + ") ? " + inner + " : " + rest;
    } else {
      let cond = cg_pattern_condition(pat, subj_var);
      if (arm.guard != null) {
        let g = cg_emit_expr(st, arm.guard);
        if (cond == "true") {
          cond = g;
        } else {
          cond = "(" + cond + ") && (" + g + ")";
        }
      }
      let body = cg_emit_expr(st, arm.body);
      if (cond == "true") {
        return body;
      } else {
        return "(" + cond + ") ? " + body + " : " + rest;
      }
    }
  }
};

/**
 * @param {CgState} st
 * @param {*} expr
 * @returns {string}
 */
const cg_emit_match = (st, expr) => {
  let subj = cg_emit_expr(st, expr.subject);
  let chain = cg_match_chain(st, expr.arms, 0, "_m");
  return "((_m) => " + chain + ")(" + subj + ")";
};

/**
 * @param {CgState} st
 * @param {*} expr
 * @returns {string}
 */
const cg_emit_template = (st, expr) => {
  if (expr.quasis == null || expr.exprs == null) {
    return expr.raw;
  } else {
    let parts = "";
    let i = 0;
    while (i < expr.quasis.length) {
      parts = parts + expr.quasis[i];
      if (i < expr.exprs.length) {
        parts = parts + "${" + cg_emit_expr(st, expr.exprs[i]) + "}";
      }
      i = i + 1;
    }
    return "`" + parts + "`";
  }
};

/**
 * @param {CgState} st
 * @param {*} expr
 * @param {string} parent_op
 * @returns {string}
 */
const cg_emit_expr_paren = (st, expr, parent_op) => {
  let s = cg_emit_expr(st, expr);
  if (expr.kind == "BinaryExpr") {
    let child_op = binop_js(expr.op);
    if (precedence(child_op) < precedence(parent_op)) {
      return "(" + s + ")";
    } else {
      return s;
    }
  } else if (expr.kind == "TernaryExpr") {
    return "(" + s + ")";
  } else {
    return s;
  }
};

/**
 * @param {CgState} st
 * @param {*} expr
 * @returns {string}
 */
const cg_emit_expr = (st, expr) => {
  let k = expr.kind;
  if (k == "NumberLit") {
    if (expr.raw != null && expr.raw != "") {
      return expr.raw;
    } else {
      return expr.value;
    }
  } else if (k == "StringLit") {
    return expr.raw;
  } else if (k == "TemplateLit") {
    return cg_emit_template(st, expr);
  } else if (k == "BoolLit") {
    if (expr.value) {
      return "true";
    } else {
      return "false";
    }
  } else if (k == "NullLit") {
    return "null";
  } else if (k == "Identifier") {
    return cg_emit_name(st, expr.name);
  } else if (k == "UnaryExpr") {
    let op = expr.op;
    if (op == "not") {
      op = "!";
    }
    if (expr.prefix) {
      if (op == "!") {
        return "!" + cg_emit_expr(st, expr.operand);
      } else if (op == "typeof" || op == "await") {
        return op + " " + cg_emit_expr(st, expr.operand);
      } else {
        return op + cg_emit_expr(st, expr.operand);
      }
    } else {
      return cg_emit_expr(st, expr.operand) + op;
    }
  } else if (k == "BinaryExpr") {
    if (expr.op == "=") {
      return cg_emit_expr(st, expr.left) + " = " + cg_emit_expr(st, expr.right);
    } else if (expr.op == "+=" || expr.op == "-=" || expr.op == "*=" || expr.op == "/=" || expr.op == "%=" || expr.op == "??=") {
      return cg_emit_expr(st, expr.left) + " " + expr.op + " " + cg_emit_expr(st, expr.right);
    } else {
      let op = binop_js(expr.op);
      let l = cg_emit_expr_paren(st, expr.left, op);
      let r = cg_emit_expr_paren(st, expr.right, op);
      return l + " " + op + " " + r;
    }
  } else if (k == "TernaryExpr") {
    return cg_emit_expr(st, expr.test) + " ? " + cg_emit_expr(st, expr.consequent) + " : " + cg_emit_expr(st, expr.alternate);
  } else if (k == "CallExpr") {
    let args = "";
    let i = 0;
    while (i < expr.args.length) {
      if (i > 0) {
        args = args + ", ";
      }
      args = args + cg_emit_expr(st, expr.args[i]);
      i = i + 1;
    }
    if (expr.callee.kind == "Identifier" && expr.callee.name == "print") {
      return "console.log(" + args + ")";
    } else if (expr.callee.kind == "MemberExpr" && is_stdlib_method(expr.callee.property)) {
      let obj = cg_emit_expr(st, expr.callee.object);
      return "$" + expr.callee.property + "(" + obj + ", " + args + ")";
    } else if (expr.callee.kind == "Identifier") {
      return cg_emit_name(st, expr.callee.name) + "(" + args + ")";
    } else {
      return cg_emit_expr(st, expr.callee) + "(" + args + ")";
    }
  } else if (k == "MemberExpr") {
    let opt = (() => {
      if (expr.optional) {
        return "?.";
      } else {
        return ".";
      }
})();
    return cg_emit_expr(st, expr.object) + opt + expr.property;
  } else if (k == "IndexExpr") {
    let opt = (() => {
      if (expr.optional) {
        return "?.";
      } else {
        return "";
      }
})();
    return cg_emit_expr(st, expr.object) + opt + "[" + cg_emit_expr(st, expr.index) + "]";
  } else if (k == "MatchExpr") {
    return cg_emit_match(st, expr);
  } else if (k == "ArrayLit") {
    let elems = "";
    let i = 0;
    while (i < expr.elements.length) {
      if (i > 0) {
        elems = elems + ", ";
      }
      elems = elems + cg_emit_expr(st, expr.elements[i]);
      i = i + 1;
    }
    return "[" + elems + "]";
  } else if (k == "ObjectLit") {
    let props = "";
    let i = 0;
    while (i < expr.properties.length) {
      if (i > 0) {
        props = props + ", ";
      }
      props = props + expr.properties[i].key + ": " + cg_emit_expr(st, expr.properties[i].value);
      i = i + 1;
    }
    return "{" + props + "}";
  } else if (k == "AwaitExpr") {
    return "await " + cg_emit_expr(st, expr.value);
  } else if (k == "ResultPropagateExpr") {
    return "$unwrap(" + cg_emit_expr(st, expr.value) + ")";
  } else if (k == "PipelineExpr") {
    return cg_emit_pipeline(st, expr.steps);
  } else if (k == "LambdaExpr") {
    let params = "";
    let i = 0;
    while (i < expr.params.length) {
      if (i > 0) {
        params = params + ", ";
      }
      params = params + lambda_param_name(expr.params[i]);
      i = i + 1;
    }
    let s = cg_push_scope(st);
    i = 0;
    while (i < expr.params.length) {
      s = cg_declare(s, lambda_param_name(expr.params[i]));
      i = i + 1;
    }
    let body = cg_emit_expr(s, expr.body);
    s = cg_pop_scope(s);
    return "(" + params + ") => " + cg_arrow_body_wrap(expr.body, body);
  } else if (k == "BlockExpr") {
    let inner = CgState([], st.indent + 1, st.scopes);
    inner = cg_emit_block(inner, expr);
    return "(() => {\n" + cg_join_strings(inner.lines, "") + "})()";
  } else {
    return "";
  }
};

/**
 * @param {CgState} st
 * @param {*} block
 * @returns {CgState}
 */
const cg_emit_block = (st, block) => {
  let s = st;
  let i = 0;
  while (i < block.stmts.length) {
    s = cg_emit_stmt(s, block.stmts[i]);
    i = i + 1;
  }
  return s;
};

/**
 * @param {CgState} st
 * @param {*} stmt
 * @returns {CgState}
 */
const cg_emit_if_chain = (st, stmt) => {
  let s = cg_emit_line(st, "if (" + cg_emit_expr(st, stmt.test) + ") {");
  s = CgState(s.lines, s.indent + 1, s.scopes);
  s = cg_emit_block(s, stmt.then);
  s = CgState(s.lines, s.indent - 1, s.scopes);
  let else_block = stmt.else_;
  while (else_block != null) {
    let stmts = else_block.stmts;
    if (stmts.length == 1 && stmts[0].kind == "IfStmt") {
      let inner = stmts[0];
      s = cg_emit_line(s, "} else if (" + cg_emit_expr(s, inner.test) + ") {");
      s = CgState(s.lines, s.indent + 1, s.scopes);
      s = cg_emit_block(s, inner.then);
      s = CgState(s.lines, s.indent - 1, s.scopes);
      else_block = inner.else_;
    } else {
      s = cg_emit_line(s, "} else {");
      s = CgState(s.lines, s.indent + 1, s.scopes);
      s = cg_emit_block(s, else_block);
      s = CgState(s.lines, s.indent - 1, s.scopes);
      else_block = null;
    }
  }
  return cg_emit_line(s, "}");
};

/**
 * @param {CgState} st
 * @param {*} stmt
 * @returns {CgState}
 */
const cg_emit_stmt = (st, stmt) => {
  let k = stmt.kind;
  if (k == "LetStmt") {
    if (stmt.value != null && stmt.value.kind == "ResultPropagateExpr") {
      let tmp = "_r" + st.lines.length;
      let inner = cg_emit_expr(st, stmt.value.value);
      let s = cg_emit_line(st, "const " + tmp + " = " + inner + ";");
      s = cg_emit_line(s, "if (" + tmp + ".tag === 'Err') return " + tmp + ";");
      if (stmt.name == null) {
        return s;
      } else {
        let s2 = cg_declare(s, stmt.name);
        return cg_emit_line(s2, "let " + stmt.name + " = " + tmp + ".value;");
      }
    } else {
      let val = cg_emit_expr(st, stmt.value);
      if (stmt.name == null) {
        return cg_emit_line(st, val + ";");
      } else {
        let s = cg_declare(st, stmt.name);
        return cg_emit_line(s, "let " + stmt.name + " = " + val + ";");
      }
    }
  } else if (k == "ReturnStmt") {
    if (stmt.value != null && stmt.value.kind == "ResultPropagateExpr") {
      let tmp = "_r" + st.lines.length;
      let inner = cg_emit_expr(st, stmt.value.value);
      let s = cg_emit_line(st, "const " + tmp + " = " + inner + ";");
      s = cg_emit_line(s, "if (" + tmp + ".tag === 'Err') return " + tmp + ";");
      return cg_emit_line(s, "return " + tmp + ".value;");
    } else {
      return cg_emit_line(st, "return " + cg_emit_expr(st, stmt.value) + ";");
    }
  } else if (k == "ExprStmt") {
    if (stmt.value != null && stmt.value.kind == "ResultPropagateExpr") {
      let tmp = "_r" + st.lines.length;
      let inner = cg_emit_expr(st, stmt.value.value);
      let s = cg_emit_line(st, "const " + tmp + " = " + inner + ";");
      return cg_emit_line(s, "if (" + tmp + ".tag === 'Err') return " + tmp + ";");
    } else {
      return cg_emit_line(st, cg_emit_expr(st, stmt.value) + ";");
    }
  } else if (k == "IfStmt") {
    return cg_emit_if_chain(st, stmt);
  } else if (k == "ForRangeStmt") {
    let lo = cg_emit_expr(st, stmt.lo);
    let hi = cg_emit_expr(st, stmt.hi);
    let op = (() => {
      if (stmt.inclusive) {
        return "<=";
      } else {
        return "<";
      }
})();
    let s = cg_emit_line(st, "for (let " + stmt.varName + " = " + lo + "; " + stmt.varName + " " + op + " " + hi + "; " + stmt.varName + "++) {");
    s = CgState(s.lines, s.indent + 1, s.scopes);
    s = cg_push_scope(s);
    s = cg_declare(s, stmt.varName);
    s = cg_emit_block(s, stmt.body);
    s = cg_pop_scope(s);
    s = CgState(s.lines, s.indent - 1, s.scopes);
    return cg_emit_line(s, "}");
  } else if (k == "ForInStmt") {
    let iter = cg_emit_expr(st, stmt.iter);
    let s = cg_emit_line(st, "for (const " + stmt.varName + " of " + iter + ") {");
    s = CgState(s.lines, s.indent + 1, s.scopes);
    s = cg_push_scope(s);
    s = cg_declare(s, stmt.varName);
    s = cg_emit_block(s, stmt.body);
    s = cg_pop_scope(s);
    s = CgState(s.lines, s.indent - 1, s.scopes);
    return cg_emit_line(s, "}");
  } else if (k == "WhileStmt") {
    let s = cg_emit_line(st, "while (" + cg_emit_expr(st, stmt.test) + ") {");
    s = CgState(s.lines, s.indent + 1, s.scopes);
    s = cg_emit_block(s, stmt.body);
    s = CgState(s.lines, s.indent - 1, s.scopes);
    return cg_emit_line(s, "}");
  } else if (k == "BreakStmt") {
    return cg_emit_line(st, "break;");
  } else if (k == "ContinueStmt") {
    return cg_emit_line(st, "continue;");
  } else {
    return st;
  }
};

/**
 * @param {CgState} st
 * @param {*} params
 * @param {*} return_type
 * @returns {CgState}
 */
const cg_emit_jsdoc = (st, params, return_type) => {
  let s = cg_emit_line(st, "/**");
  let i = 0;
  while (i < params.length) {
    let p = params[i];
    let spread = (() => {
      if (p.spread) {
        return "...";
      } else {
        return "";
      }
})();
    s = cg_emit_line(s, " * @param {" + cg_type_to_js(p.type) + "} " + spread + p.name);
    i = i + 1;
  }
  s = cg_emit_line(s, " * @returns {" + cg_type_to_js(return_type) + "}");
  return cg_emit_line(s, " */");
};

/**
 * @param {CgState} st
 * @param {*} step
 * @param {string} acc
 * @returns {string}
 */
const cg_apply_pipe_step = (st, step, acc) => {
  if (step.kind == "Identifier") {
    return cg_emit_name(st, step.name) + "(" + acc + ")";
  } else if (step.kind == "CallExpr") {
    let callee = cg_emit_expr(st, step.callee);
    let extra = "";
    let i = 0;
    while (i < step.args.length) {
      if (i > 0) {
        extra = extra + ", ";
      }
      extra = extra + cg_emit_expr(st, step.args[i]);
      i = i + 1;
    }
    if (extra == "") {
      return callee + "(" + acc + ")";
    } else {
      return callee + "(" + acc + ", " + extra + ")";
    }
  } else if (step.kind == "LambdaExpr") {
    return "(" + cg_emit_expr(st, step) + ")(" + acc + ")";
  } else {
    return "(" + cg_emit_expr(st, step) + ")(" + acc + ")";
  }
};

/**
 * @param {CgState} st
 * @param {*} steps
 * @returns {string}
 */
const cg_emit_pipeline = (st, steps) => {
  if (steps.length == 0) {
    return "undefined";
  } else {
    let has_pipe_as = false;
    let i = 0;
    while (i < steps.length) {
      if (steps[i].kind == "PipeAs") {
        has_pipe_as = true;
      }
      i = i + 1;
    }
    if (!has_pipe_as) {
      let acc = cg_emit_expr(st, steps[0]);
      i = 1;
      while (i < steps.length) {
        acc = cg_apply_pipe_step(st, steps[i], acc);
        i = i + 1;
      }
      return acc;
    } else {
      let block_lines = [];
      let acc = cg_emit_expr(st, steps[0]);
      i = 1;
      while (i < steps.length) {
        let step = steps[i];
        if (step.kind == "PipeAs") {
          block_lines = block_lines.concat(["const " + step.name + " = " + acc + ";"]);
          acc = step.name;
        } else {
          acc = cg_apply_pipe_step(st, step, acc);
        }
        i = i + 1;
      }
      let inner = "";
      let j = 0;
      while (j < block_lines.length) {
        inner = inner + "  " + block_lines[j] + "\n";
        j = j + 1;
      }
      return "(() => {\n" + inner + "  return " + acc + ";\n})()";
    }
  }
};

/**
 * @param {*} decl
 * @param {string} ann_name
 * @returns {boolean}
 */
const fn_has_annotation = (decl, ann_name) => {
  let i = 0;
  while (i < decl.annotations.length) {
    if (decl.annotations[i].name == ann_name) {
      return true;
    }
    i = i + 1;
  }
  return false;
};

/**
 * @param {CgState} st
 * @param {*} decl
 * @returns {CgState}
 */
const cg_emit_enum = (st, decl) => {
  let members = "";
  let i = 0;
  while (i < decl.variants.length) {
    if (i > 0) {
      members = members + ", ";
    }
    let v = decl.variants[i].name;
    members = members + v + ": '" + v + "'";
    i = i + 1;
  }
  return cg_emit_line(st, "const " + decl.name + " = Object.freeze({ " + members + " });");
};

/**
 * @param {CgState} st
 * @param {*} decl
 * @returns {CgState}
 */
const cg_emit_tagged_union = (st, decl) => {
  let s = st;
  let i = 0;
  while (i < decl.variants.length) {
    let v = decl.variants[i];
    if (v.fields.length == 0) {
      s = cg_emit_line(s, "const " + v.name + " = Object.freeze({ tag: \"" + v.name + "\" });");
    } else {
      let params = "";
      let fields = "";
      let fi = 0;
      while (fi < v.fields.length) {
        if (fi > 0) {
          params = params + ", ";
          fields = fields + ", ";
        }
        params = params + v.fields[fi].name;
        fields = fields + v.fields[fi].name;
        fi = fi + 1;
      }
      s = cg_emit_line(s, "const " + v.name + " = (" + params + ") => Object.freeze({ tag: \"" + v.name + "\", " + fields + " });");
    }
    i = i + 1;
  }
  return s;
};

/**
 * @param {CgState} st
 * @param {*} decl
 * @returns {CgState}
 */
const cg_emit_record = (st, decl) => {
  let params = "";
  let body = "";
  let i = 0;
  while (i < decl.fields.length) {
    if (i > 0) {
      params = params + ", ";
      body = body + ", ";
    }
    params = params + decl.fields[i].name;
    body = body + decl.fields[i].name;
    i = i + 1;
  }
  return cg_emit_line(st, "const " + decl.name + " = (" + params + ") => ({ " + body + " });");
};

/**
 * @param {CgState} st
 * @param {*} decl
 * @returns {CgState}
 */
const cg_emit_store = (st, decl) => {
  let defaults = "";
  let i = 0;
  while (i < decl.fields.length) {
    if (i > 0) {
      defaults = defaults + ", ";
    }
    defaults = defaults + decl.fields[i].name + ": " + cg_emit_expr(st, decl.fields[i].defaultValue);
    i = i + 1;
  }
  let s = cg_emit_line(st, "const " + decl.name + " = (() => {");
  s = CgState(s.lines, s.indent + 1, s.scopes);
  s = cg_emit_line(s, "let _state = { " + defaults + " };");
  s = cg_emit_line(s, "const _subs = [];");
  s = cg_emit_line(s, "return {");
  s = CgState(s.lines, s.indent + 1, s.scopes);
  i = 0;
  while (i < decl.fields.length) {
    let fname = decl.fields[i].name;
    s = cg_emit_line(s, "get " + fname + "() { return _state." + fname + "; },");
    i = i + 1;
  }
  s = cg_emit_line(s, "set(patch) {");
  s = CgState(s.lines, s.indent + 1, s.scopes);
  s = cg_emit_line(s, "_state = Object.assign({}, _state, patch);");
  s = cg_emit_line(s, "for (const __fn of _subs) __fn(_state);");
  s = CgState(s.lines, s.indent - 1, s.scopes);
  s = cg_emit_line(s, "},");
  s = cg_emit_line(s, "subscribe(fn) { _subs.push(fn); fn(_state); },");
  s = CgState(s.lines, s.indent - 1, s.scopes);
  s = cg_emit_line(s, "};");
  s = CgState(s.lines, s.indent - 1, s.scopes);
  return cg_emit_line(s, "})();");
};

/**
 * @param {CgState} st
 * @param {*} decl
 * @returns {CgState}
 */
const cg_emit_fn = (st, decl) => {
  let param_str = "";
  let i = 0;
  while (i < decl.params.length) {
    if (i > 0) {
      param_str = param_str + ", ";
    }
    let p = decl.params[i];
    if (p.spread) {
      param_str = param_str + "..." + p.name;
    } else {
      param_str = param_str + p.name;
    }
    i = i + 1;
  }
  let async_kw = (() => {
    if (decl.isAsync) {
      return "async ";
    } else {
      return "";
    }
})();
  if (fn_has_annotation(decl, "memo")) {
    let s = cg_emit_line(st, "const " + decl.name + " = (() => {");
    s = CgState(s.lines, s.indent + 1, s.scopes);
    s = cg_emit_line(s, "const __cache = new Map();");
    s = cg_emit_line(s, "return (" + param_str + ") => {");
    s = CgState(s.lines, s.indent + 1, s.scopes);
    s = cg_emit_line(s, "const __key = JSON.stringify([" + param_str + "]);");
    s = cg_emit_line(s, "if (__cache.has(__key)) return __cache.get(__key);");
    s = cg_emit_line(s, "const __result = (() => {");
    s = CgState(s.lines, s.indent + 1, s.scopes);
    s = cg_push_scope(s);
    i = 0;
    while (i < decl.params.length) {
      s = cg_declare(s, decl.params[i].name);
      i = i + 1;
    }
    if (decl.body.kind == "BlockExpr") {
      s = cg_emit_block(s, decl.body);
    } else {
      s = cg_emit_line(s, "return " + cg_emit_expr(s, decl.body) + ";");
    }
    s = cg_pop_scope(s);
    s = CgState(s.lines, s.indent - 1, s.scopes);
    s = cg_emit_line(s, "})();");
    s = cg_emit_line(s, "__cache.set(__key, __result);");
    s = cg_emit_line(s, "return __result;");
    s = CgState(s.lines, s.indent - 1, s.scopes);
    s = cg_emit_line(s, "};");
    s = CgState(s.lines, s.indent - 1, s.scopes);
    return cg_emit_line(s, "})();");
  } else if (decl.shortForm) {
    let s = cg_push_scope(st);
    i = 0;
    while (i < decl.params.length) {
      s = cg_declare(s, decl.params[i].name);
      i = i + 1;
    }
    let body = cg_emit_expr(s, decl.body);
    s = cg_pop_scope(s);
    return cg_emit_line(s, "const " + decl.name + " = " + async_kw + "(" + param_str + ") => " + cg_arrow_body_wrap(decl.body, body) + ";");
  } else {
    let s = cg_emit_jsdoc(st, decl.params, decl.returnType);
    s = cg_push_scope(s);
    i = 0;
    while (i < decl.params.length) {
      s = cg_declare(s, decl.params[i].name);
      i = i + 1;
    }
    let body = cg_emit_expr(s, decl.body);
    s = cg_pop_scope(s);
    if (decl.body.kind == "BlockExpr") {
      s = cg_emit_line(s, "const " + decl.name + " = " + async_kw + "(" + param_str + ") => {");
      s = CgState(s.lines, s.indent + 1, s.scopes);
      s = cg_push_scope(s);
      i = 0;
      while (i < decl.params.length) {
        s = cg_declare(s, decl.params[i].name);
        i = i + 1;
      }
      s = cg_emit_block(s, decl.body);
      s = cg_pop_scope(s);
      s = CgState(s.lines, s.indent - 1, s.scopes);
      return cg_emit_line(s, "};");
    } else {
      return cg_emit_line(s, "const " + decl.name + " = " + async_kw + "(" + param_str + ") => " + cg_arrow_body_wrap(decl.body, body) + ";");
    }
  }
};

/**
 * @param {string} s
 * @returns {string}
 */
const cg_json_string = (s) => {
  let out = "\"";
  let i = 0;
  while (i < s.length) {
    let c = s.slice(i, i + 1);
    if (c == "\\") {
      out = out + "\\\\";
    } else if (c == "\"") {
      out = out + "\\\"";
    } else if (c == "\n") {
      out = out + "\\n";
    } else if (c == "\r") {
      out = out + "\\r";
    } else if (c == "\t") {
      out = out + "\\t";
    } else {
      out = out + c;
    }
    i = i + 1;
  }
  return out + "\"";
};

/**
 * @param {CgState} st
 * @param {*} decl
 * @returns {CgState}
 */
const cg_emit_test = (st, decl) => {
  let body = cg_emit_expr(st, decl.body);
  return cg_emit_line(st, "__synth_tests.push({ desc: " + cg_json_string(decl.description) + ", fn: () => " + body + " });");
};

/**
 * @param {CgState} st
 * @param {*} decl
 * @returns {CgState}
 */
const cg_emit_top_level = (st, decl) => {
  let k = decl.kind;
  if (k == "TopLevelExpr") {
    return cg_emit_line(st, cg_emit_expr(st, decl.expr) + ";");
  } else if (k == "TopLevelLet") {
    let val = cg_emit_expr(st, decl.value);
    if (decl.name == null) {
      return cg_emit_line(st, val + ";");
    } else {
      let s = cg_declare(st, decl.name);
      return cg_emit_line(s, "let " + decl.name + " = " + val + ";");
    }
  } else if (k == "TopLevelStmt") {
    return cg_emit_stmt(st, decl.stmt);
  } else if (k == "FnDecl") {
    return cg_emit_fn(st, decl);
  } else if (k == "EnumDecl") {
    return cg_emit_enum(st, decl);
  } else if (k == "TaggedUnionDecl") {
    return cg_emit_tagged_union(st, decl);
  } else if (k == "RecordDecl") {
    return cg_emit_record(st, decl);
  } else if (k == "StoreDecl") {
    return cg_emit_store(st, decl);
  } else if (k == "TestDecl") {
    return cg_emit_test(st, decl);
  } else if (k == "ExportDecl") {
    return cg_emit_top_level(st, decl.decl);
  } else if (k == "ImportDecl") {
    return st;
  } else {
    return st;
  }
};

/**
 * @param {Program} program
 * @returns {string}
 */
const generate = (program) => {
  let st = CgState([], 0, [[]]);
  let i = 0;
  while (i < program.body.length) {
    let decl = program.body[i];
    st = cg_emit_top_level(st, decl);
    let has_next = i + 1 < program.body.length;
    if (has_next) {
      let next = program.body[i + 1];
      if (is_block_decl(decl) || is_block_decl(next)) {
        st = cg_emit_blank(st);
      }
    } else if (is_block_decl(decl)) {
      st = cg_emit_blank(st);
    }
    i = i + 1;
  }
  return cg_join_strings(st.lines, "");
};



// ─── formatter.syn ─────────────────────────────────────


const FormatResult = (formatted, changed) => ({ formatted, changed });

/**
 * @returns {string}
 */
const nl = () => String.fromCharCode(10);

/**
 * @returns {string}
 */
const cr = () => String.fromCharCode(13);

/**
 * @param {string} source
 * @returns {string}
 */
const normalise_newlines = (source) => {
  let crlf = cr() + nl();
  let s = source;
  while ($contains(s, crlf)) {
    s = s.replace(crlf, nl());
  }
  return s;
};

/**
 * @param {string} tok_type
 * @returns {boolean}
 */
const no_space_before = (tok_type) => tok_type == "RPAREN" || tok_type == "RBRACKET" || tok_type == "RBRACE" || tok_type == "COMMA" || tok_type == "SEMICOLON" || tok_type == "DOT" || tok_type == "OPTIONAL_CHAIN" || tok_type == "PIPE";

/**
 * @param {string} tok_type
 * @returns {boolean}
 */
const no_space_after = (tok_type) => tok_type == "LPAREN" || tok_type == "LBRACKET" || tok_type == "DOT" || tok_type == "OPTIONAL_CHAIN" || tok_type == "AT" || tok_type == "BANG" || tok_type == "MINUS";

/**
 * @param {string} tok_type
 * @returns {boolean}
 */
const space_before = (tok_type) => tok_type == "LBRACE" || tok_type == "THIN_ARROW" || tok_type == "FAT_ARROW" || tok_type == "DOUBLE_COLON" || tok_type == "PIPE_OP" || tok_type == "AND" || tok_type == "OR" || tok_type == "EQ" || tok_type == "STRICT_EQ" || tok_type == "NEQ" || tok_type == "STRICT_NEQ" || tok_type == "LTE" || tok_type == "GTE" || tok_type == "ASSIGN" || tok_type == "NULL_COALESCE" || tok_type == "KW_ELSE";

/**
 * @param {string} tok_type
 * @returns {boolean}
 */
const space_after = (tok_type) => tok_type == "COMMA" || tok_type == "COLON" || tok_type == "THIN_ARROW" || tok_type == "FAT_ARROW" || tok_type == "DOUBLE_COLON" || tok_type == "PIPE_OP" || tok_type == "AND" || tok_type == "OR" || tok_type == "EQ" || tok_type == "STRICT_EQ" || tok_type == "NEQ" || tok_type == "STRICT_NEQ" || tok_type == "LTE" || tok_type == "GTE" || tok_type == "ASSIGN" || tok_type == "NULL_COALESCE" || tok_type == "KW_FN" || tok_type == "KW_TYPE" || tok_type == "KW_RECORD" || tok_type == "KW_LET" || tok_type == "KW_MATCH" || tok_type == "KW_IF" || tok_type == "KW_ELSE" || tok_type == "KW_RETURN" || tok_type == "KW_FOR" || tok_type == "KW_IN" || tok_type == "KW_ASYNC" || tok_type == "KW_AWAIT" || tok_type == "KW_IMPORT" || tok_type == "KW_EXPORT" || tok_type == "KW_FROM" || tok_type == "KW_INTERFACE" || tok_type == "KW_REFINE" || tok_type == "KW_INFER" || tok_type == "KW_MUT" || tok_type == "KW_WHEN" || tok_type == "KW_AS" || tok_type == "KW_NEW" || tok_type == "KW_WHERE";

/**
 * @param {string} tok_type
 * @returns {boolean}
 */
const is_op_type = (tok_type) => tok_type == "ASSIGN" || tok_type == "PLUS" || tok_type == "MINUS" || tok_type == "STAR" || tok_type == "SLASH" || tok_type == "PERCENT" || tok_type == "COMMA" || tok_type == "LPAREN" || tok_type == "LBRACKET" || tok_type == "PIPE_OP" || tok_type == "FAT_ARROW" || tok_type == "THIN_ARROW" || tok_type == "COLON";

/**
 * @param {string} prev_type
 * @param {string} cur_type
 * @returns {boolean}
 */
const needs_space = (prev_type, cur_type) => {
  if (no_space_before(cur_type)) {
    return false;
  } else if (no_space_after(prev_type)) {
    return false;
  } else if (space_before(cur_type)) {
    return true;
  } else if (space_after(prev_type)) {
    return true;
  } else if (prev_type == "PLUS" || cur_type == "PLUS") {
    return true;
  } else if (prev_type == "STAR" || cur_type == "STAR") {
    return true;
  } else if (prev_type == "SLASH" || cur_type == "SLASH") {
    return true;
  } else if (prev_type == "PERCENT" || cur_type == "PERCENT") {
    return true;
  } else if (prev_type == "LT" || cur_type == "LT") {
    return false;
  } else if (prev_type == "GT" || cur_type == "GT") {
    return false;
  } else if (cur_type == "MINUS") {
    return !is_op_type(prev_type);
  } else if (prev_type == "MINUS") {
    return !cur_type == "IDENT" || cur_type == "NUMBER" || cur_type == "LPAREN";
  } else if (cur_type == "LPAREN") {
    return false;
  } else if (cur_type == "LBRACKET" && prev_type == "IDENT") {
    return false;
  } else if (cur_type == "RBRACE") {
    return prev_type != "LBRACE";
  } else if (prev_type == "LBRACE") {
    return cur_type != "RBRACE";
  } else if (cur_type == "PIPE" || prev_type == "PIPE") {
    return true;
  } else {
    return true;
  }
};

/**
 * @param {*} tokens
 * @returns {*}
 */
const filter_eof_tokens = (tokens) => {
  let out = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type != "EOF") {
      out = out.concat([tokens[i]]);
    }
    i = i + 1;
  }
  return out;
};

/**
 * @param {*} tokens
 * @param {number} line
 * @returns {*}
 */
const tokens_for_line = (tokens, line) => {
  let out = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].line == line) {
      out = out.concat([tokens[i]]);
    }
    i = i + 1;
  }
  return out;
};

/**
 * @param {*} tokens
 * @returns {number}
 */
const max_token_line = (tokens) => {
  let m = 0;
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].line > m) {
      m = tokens[i].line;
    }
    i = i + 1;
  }
  return m;
};

/**
 * @param {string} ch
 * @param {number} n
 * @returns {string}
 */
const repeat_str = (ch, n) => {
  let s = "";
  let i = 0;
  while (i < n) {
    s = s + ch;
    i = i + 1;
  }
  return s;
};

/**
 * @param {*} toks
 * @returns {string}
 */
const format_line_tokens = (toks) => {
  let line_out = "";
  let j = 0;
  while (j < toks.length) {
    let tok = toks[j];
    if (j == 0) {
      line_out = tok.value;
    } else {
      let prev = toks[j - 1];
      let sep = (() => {
        if (needs_space(prev.type, tok.type)) {
          return " ";
        } else {
          return "";
        }
})();
      line_out = line_out + sep + tok.value;
    }
    j = j + 1;
  }
  return line_out;
};

/**
 * @param {*} toks
 * @param {boolean} first_is_rbrace
 * @param {number} depth
 * @returns {number}
 */
const adjust_depth_after_tokens = (toks, first_is_rbrace, depth) => {
  let d = depth;
  let k = 0;
  while (k < toks.length) {
    let t = toks[k];
    if (t.type == "LBRACE") {
      d = d + 1;
    } else if (t.type == "RBRACE") {
      if (!first_is_rbrace && k == 0) {
        if (d > 0) {
          d = d - 1;
        } else {
          d = 0;
        }
      }
    }
    k = k + 1;
  }
  return d;
};

/**
 * @param {string} source
 * @returns {FormatResult}
 */
const format_source = (source) => {
  let normalised = normalise_newlines(source);
  let tokens = filter_eof_tokens(tokenize(normalised));
  if (tokens.length == 0) {
    return FormatResult("", false);
  } else {
    let max_line = max_token_line(tokens);
    let depth = 0;
    let result_lines = [];
    let line = 1;
    while (line <= max_line) {
      let toks = tokens_for_line(tokens, line);
      if (toks.length == 0) {
        result_lines = result_lines.concat([""]);
      } else {
        let first_tok = toks[0];
        if (first_tok.type == "RBRACE") {
          if (depth > 0) {
            depth = depth - 1;
          } else {
            depth = 0;
          }
        }
        let line_body = format_line_tokens(toks);
        let indent = repeat_str(" ", depth * 2);
        result_lines = result_lines.concat([indent + line_body]);
        depth = adjust_depth_after_tokens(toks, first_tok.type == "RBRACE", depth);
      }
      line = line + 1;
    }
    let formatted = "";
    let ri = 0;
    while (ri < result_lines.length) {
      if (ri > 0) {
        formatted = formatted + nl();
      }
      formatted = formatted + result_lines[ri];
      ri = ri + 1;
    }
    if (normalised.endsWith(nl())) {
      formatted = formatted + nl();
    }
    return FormatResult(formatted, formatted != normalised);
  }
};



// ─── driver.syn ────────────────────────────────────────


const CompileResult = (js, warnings) => ({ js, warnings });

/**
 * @param {string} source
 * @returns {CompileResult}
 */
const compile = (source) => {
  let tokens = tokenize(source);
  let ast = parse(tokens);
  let warnings = check(ast);
  let js = generate(ast);
  return CompileResult(js, warnings);
};

/**
 * @param {string} source
 * @returns {*}
 */
const check_source = (source) => check(parse(tokenize(source)));

/**
 * @param {string} source
 * @returns {FormatResult}
 */
const format = (source) => format_source(source);

