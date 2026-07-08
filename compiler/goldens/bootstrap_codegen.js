
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

