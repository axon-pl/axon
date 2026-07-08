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

