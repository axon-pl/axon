
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

