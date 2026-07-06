const { Lexer } = require('../dist/lexer.js');
const { Parser } = require('../dist/parser.js');
const { Codegen } = require('../dist/codegen.js');
const stdlib = require('../dist/stdlib.js');
const vm = require('vm');

function run(name, src, expected) {
  const { ast, errors } = new Parser(new Lexer(src).tokenize()).parse();
  if (errors.length) {
    console.log(`FAIL [${name}] parse: ${errors[0].message}`);
    return false;
  }
  const js = new Codegen().generate(ast);
  const log = [];
  const ctx = { console: { log: (...a) => log.push(a.join(' ')) }, ...stdlib };
  vm.createContext(ctx);
  try {
    vm.runInContext(js, ctx);
    if (expected !== undefined) {
      const actual = log.join('\n');
      if (actual !== expected) {
        console.log(`FAIL [${name}]\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
        return false;
      }
    }
    console.log(`PASS [${name}] → ${log.join(', ')}`);
    return true;
  } catch (e) {
    console.log(`FAIL [${name}] runtime: ${e.message}`);
    console.log('  emitted JS:\n' + js.split('\n').slice(0, 20).join('\n'));
    return false;
  }
}

let ok = 0, total = 0;
function test(name, src, expected) { total++; if (run(name, src, expected)) ok++; }

// Basic while countdown
test('basic while', `
let mut n = 3
while n > 0 {
  console.log(n)
  n -= 1
}
`, '3\n2\n1');

// while false — never runs
test('while false', `
let mut ran = false
while false {
  ran = true
}
console.log(ran)
`, 'false');

// break exits early
test('break', `
let mut i = 0
while true {
  i += 1
  if i == 3 { break }
}
console.log(i)
`, '3');

// continue skips
test('continue odd only', `
let mut x = 0
let mut out = ""
while x < 6 {
  x += 1
  if x % 2 == 0 { continue }
  out += x + " "
}
console.log(out)
`, '1 3 5 ');

// nested while + break
test('nested while', `
let mut i = 0
while i < 3 {
  let mut j = 0
  while j < 3 {
    if j == 2 { break }
    console.log(i + "," + j)
    j += 1
  }
  i += 1
}
`, '0,0\n0,1\n1,0\n1,1\n2,0\n2,1');

// while with compound assignment
test('while + compound assign', `
let mut sum = 0
let mut k = 1
while k <= 10 {
  sum += k
  k += 1
}
console.log(sum)
`, '55');

// Collatz
test('collatz(6)', `
let mut v = 6
let mut steps = 0
while v != 1 {
  v = if v % 2 == 0 { v / 2 } else { v * 3 + 1 }
  steps += 1
}
console.log(steps)
`, '8');

// top-level while (outside function body)
test('top-level while', `
let mut acc = 0
let mut c = 1
while c <= 5 {
  acc += c
  c += 1
}
console.log(acc)
`, '15');

console.log(`\n${ok} / ${total} passed`);
if (ok < total) process.exit(1);
