const { Lexer } = require('../dist/lexer.js');
const { Parser } = require('../dist/parser.js');
const { Codegen } = require('../dist/codegen.js');
const vm = require('vm');
const stdlib = require('../dist/stdlib.js');

function run(name, src) {
  const { ast, errors } = new Parser(new Lexer(src).tokenize()).parse();
  if (errors.length) {
    console.log(`FAIL [${name}] parse:`, errors[0].message);
    return false;
  }
  const js = new Codegen().generate(ast);
  const ctx = { console, ...stdlib };
  vm.createContext(ctx);
  try {
    process.stdout.write(`PASS [${name}] → `);
    vm.runInContext(js, ctx);
    return true;
  } catch (e) {
    console.log(`\nFAIL [${name}] runtime:`, e.message);
    return false;
  }
}

let ok = 0, total = 0;
function test(name, src) { total++; if (run(name, src)) ok++; }

// String
test('trim',        'console.log(trim("  hello  "))');
test('to_upper',    'console.log(to_upper("synth"))');
test('to_lower',    'console.log(to_lower("SYNTH"))');
test('starts_with', 'console.log(starts_with("synth", "ax"))');
test('ends_with',   'console.log(ends_with("synth", "on"))');
test('contains',    'console.log(contains("synth", "xo"))');
test('replace_all', 'console.log(replace_all("1.2.3", ".", "-"))');
test('split',       'console.log(split("a,b,c", ","))');
test('pad_start',   'console.log(pad_start("7", 3, "0"))');
test('pad_end',     'console.log(pad_end("hi", 5, "."))');

// Array
test('min', 'console.log(min([3,1,4,1,5]))');
test('max', 'console.log(max([3,1,4,1,5]))');
test('min_by', `
record P { v: int }
let xs = [P(5), P(2), P(9)]
console.log(min_by(xs, x => x.v).v)
`);
test('max_by', `
record P { v: int }
let xs = [P(5), P(2), P(9)]
console.log(max_by(xs, x => x.v).v)
`);
test('take', 'console.log(take([1,2,3,4,5], 3))');
test('drop', 'console.log(drop([1,2,3,4,5], 2))');
test('uniq', 'console.log(uniq([1,2,2,3,3]))');
test('chunk', 'console.log(chunk([1,2,3,4,5,6], 2))');
test('flat_map', 'console.log(flat_map([1,2,3], x => [x, x*2]))');
test('reverse', 'console.log(reverse([1,2,3]))');
test('set_at', 'console.log(set_at([1,2,3], 1, 99))');
test('sum_by', 'console.log(sum_by([1,2,3,4], x => x*2))');

// Math
test('clamp', 'console.log(clamp(150, 0, 100))');
test('abs', 'console.log(abs(-42))');
test('round', 'console.log(round(3.7))');
test('floor', 'console.log(floor(3.9))');
test('ceil', 'console.log(ceil(3.1))');
test('pow', 'console.log(pow(2, 8))');
test('sqrt', 'console.log(sqrt(144))');

console.log(`\n${ok} / ${total} passed`);
if (ok < total) process.exit(1);
