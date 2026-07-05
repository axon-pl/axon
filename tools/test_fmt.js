const { format } = require('../dist/formatter.js');
const tests = [
  'fn add(x: int, y: int) = x + y',
  'let result = if x > 0 { x } else { -x }',
  'store Counter { n: int = 0 }',
  'type Maybe<T> = | Some { value: T } | None',
  'match n { | 0 => "zero" | n => "other" }',
];
tests.forEach(src => {
  const { formatted, changed } = format(src + '\n');
  console.log((changed ? '~ ' : 'V ') + formatted.trim());
});
