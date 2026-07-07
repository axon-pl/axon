// Quick TextMate grammar smoke-test for the Synth VS Code extension.
const fs = require('fs');
const path = require('path');
const { Registry, parseRawGrammar } = require('vscode-textmate');
const { loadWASM, OnigScanner, OnigString } = require('vscode-oniguruma');

async function main() {
  const wasmPath = require.resolve('vscode-oniguruma/release/onig.wasm');
  const wasmBytes = fs.readFileSync(wasmPath).buffer;
  await loadWASM(wasmBytes);

  const grammarPath = path.join(__dirname, '../vscode-extension/syntaxes/synth.tmLanguage.json');
  const rawContent = fs.readFileSync(grammarPath, 'utf8');

  const registry = new Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns) => new OnigScanner(patterns),
      createOnigString: (str) => new OnigString(str),
    }),
    loadGrammar: async (scopeName) => {
      if (scopeName === 'source.synth') return parseRawGrammar(rawContent, 'synth.tmLanguage.json');
      return null;
    },
  });

  const grammar = await registry.loadGrammar('source.synth');
  if (!grammar) throw new Error('Failed to load source.synth grammar');

  const samples = [
    '// comment',
    'record Brick {',
    'fn add_card(col: string, title: string, type: string) {',
    'store Game { phase: string = "title" }',
    '  `<div class="kcard">${title}</div>`',
    '  """multi\nline"""',
    '  "hello {name}"',
  ];

  for (const line of samples) {
    const { tokens } = grammar.tokenizeLine(line, null);
    const colored = tokens
      .filter((t) => t.scopes.length > 1 || t.scopes[0] !== 'source.synth')
      .map((t) => ({ text: line.slice(t.startIndex, t.endIndex), scopes: t.scopes }));
    console.log(line);
    console.log(colored.length ? colored : '  (no scoped tokens)');
    console.log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
