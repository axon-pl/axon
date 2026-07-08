
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

