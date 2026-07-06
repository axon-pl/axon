// Benchmark: output token cost of compiled Synth programs
const { Lexer }   = require('../../dist/lexer.js');
const { Parser }  = require('../../dist/parser.js');
const { Codegen } = require('../../dist/codegen.js');
const { encode }  = require('gpt-tokenizer');
const fs = require('fs');
const path = require('path');

const programs = [
  { name: 'Hello World',     src: `print("Hello, World!")` },
  { name: 'Data Pipeline',   src: fs.readFileSync(path.join(__dirname, 'bench_pipeline.syn'), 'utf8') },
  { name: 'Pattern Matching',src: fs.readFileSync(path.join(__dirname, 'bench_pattern.syn'),  'utf8') },
  { name: 'Error Handling',  src: fs.readFileSync(path.join(__dirname, 'bench_error.syn'),    'utf8') },
];

console.log('Output Token Benchmark — compiled JS token cost (GPT-4 cl100k_base)\n');

let totalBefore = 0, totalAfter = 0;

for (const prog of programs) {
  const { ast } = new Parser(new Lexer(prog.src).tokenize()).parse();
  const js = new Codegen().generate(ast);
  const lines  = js.split('\n').length;
  const tokens = encode(js).length;
  console.log(`${prog.name.padEnd(20)} ${String(lines).padStart(4)} lines   ${String(tokens).padStart(5)} tokens`);
  totalAfter += tokens;
}

console.log('\nTotal tokens (4 programs):', totalAfter);
