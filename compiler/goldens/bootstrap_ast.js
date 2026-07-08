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

