
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

