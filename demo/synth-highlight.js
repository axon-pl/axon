// Shared Synth syntax highlighter for demo pages.
// Keep in sync with vscode-extension/syntaxes/synth.tmLanguage.json + compiler/token.syn.
(function (root) {
  const KW = [
    'fn', 'let', 'type', 'record', 'store', 'interface', 'enum', 'module',
    'match', 'if', 'else', 'where', 'return', 'import', 'export', 'from',
    'async', 'await', 'on', 'as', 'for', 'in', 'while', 'break', 'continue',
    'mut', 'refine', 'infer', 'explain', 'likely', 'do', 'new', 'typeof',
    'instanceof', 'and', 'or', 'not',
  ];
  const KW2 = ['when', 'true', 'false', 'null', 'undefined', 'void'];
  const TY = [
    'int', 'float', 'string', 'bool', 'list', 'void', 'any',
    'Result', 'Ok', 'Err', 'Maybe', 'Some', 'None',
  ];
  const ANN = [
    'pure', 'total', 'intent', 'effects', 'memo', 'exhaustive', 'test', 'throws',
  ];

  const sp = (cls, t) => `<span class='${cls}'>${t}</span>`;

  function highlightSynth(src) {
    const escaped = String(src)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Single-pass: each character matched at most once so span tags are never re-tokenized.
    const result = escaped.replace(
      new RegExp(
        [
          '("""[\\s\\S]*?""")',
          '("(?:[^"\\\\]|\\\\.)*")',
          '(\\/\\/[^\\n]*)',
          `(@(?:${ANN.join('|')})\\b)`,
          '(\\|&gt;|=&gt;|-&gt;|\\?\\?|\\?\\.|::|\\|(?!\\|)|\\?(?![?\\.]))',
          '(0x[\\da-fA-F_]+|0b[01_]+|\\d+\\.?\\d*)',
          `(\\b(?:${KW.join('|')})\\b)`,
          `(\\b(?:${KW2.join('|')})\\b)`,
          `(\\b(?:${TY.join('|')})\\b)`,
        ].join('|'),
        'g'
      ),
      (_, tstr, str, cmt, ann, op, num, kw, kw2, ty) => {
        if (tstr) return sp('str', tstr);
        if (str)  return sp('str', str);
        if (cmt)  return sp('cmt', cmt);
        if (ann)  return sp('ann', ann);
        if (op)   return sp('op', op);
        if (num)  return sp('num', num);
        if (kw)   return sp('kw', kw);
        if (kw2)  return sp('bool', kw2);
        if (ty)   return sp('ty', ty);
        return _;
      }
    );

    return result.replace(
      /(<span class='kw'>fn<\/span>\s+)([a-zA-Z_]\w*)/g,
      (_, k, n) => k + sp('fn', n)
    );
  }

  root.highlightSynth = highlightSynth;
  root.SYNTH_HIGHLIGHT = { KW, KW2, TY, ANN, highlight: highlightSynth };
})(typeof window !== 'undefined' ? window : globalThis);
