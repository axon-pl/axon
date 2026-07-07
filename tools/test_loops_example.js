const { Codegen } = require('../dist/codegen.js');
const { Lexer } = require('../dist/lexer.js');
const { Parser } = require('../dist/parser.js');
const { SYNTH_STDLIB } = require('../dist/stdlib.js');

const code = `// For Loops — Prime Number Sieve
fn is_prime(n: int) -> bool {
  if n < 2 { return false }
  for i in 2..n {
    if n % i == 0 { return false }
  }
  true
}

let mut primes = []
for n in 2..=60 {
  if is_prime(n) {
    primes = primes.concat([n])
  }
}

print("Primes up to 60:")
print(primes.join("  "))
print("Count: " + primes.length)

let first5 = primes.slice(0, 5)
let mut sum = 0
let mut product = 1
for p in first5 {
  sum     += p
  product *= p
}

print("")
print("First 5 primes: " + first5.join(", "))
print("Sum:            " + sum)
print("Product:        " + product)

print("")
print("Twin prime pairs (gap = 2):")
for i in 0..primes.length - 1 {
  if primes[i + 1] - primes[i] == 2 {
    print("  (" + primes[i] + ", " + primes[i + 1] + ")")
  }
}`;

const { ast, errors: parseErrs } = new Parser(new Lexer(code).tokenize()).parse();
if (parseErrs.length) {
  console.error('parse errors', parseErrs);
  process.exit(1);
}

const js = new Codegen().generate(ast);
console.log('--- emitted ---\n' + js);

if (js.includes('$sum')) {
  console.error('FAIL: stdlib shadowing not fixed');
  process.exit(1);
}

const execJs = SYNTH_STDLIB + '{\n' + js + '\n}';
try {
  new Function(
    'console', 'Math', 'JSON', 'Array', 'Object', 'Map', 'Set',
    'String', 'Number', 'Boolean', 'Promise', 'parseInt', 'parseFloat', 'isNaN',
    execJs
  )(
    { log: (...a) => console.log(...a) },
    Math, JSON, Array, Object, Map, Set,
    String, Number, Boolean, Promise, parseInt, parseFloat, isNaN
  );
  console.log('OK');
} catch (e) {
  console.error('RUN ERROR:', e.message);
  process.exit(1);
}
