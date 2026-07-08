
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

