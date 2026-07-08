
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

