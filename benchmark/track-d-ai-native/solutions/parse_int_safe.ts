export type ParseResult = { ok: true; value: number } | { ok: false; msg: string };

const ok = (value: number): ParseResult => ({ ok: true, value });
const err = (msg: string): ParseResult => ({ ok: false, msg });

/** Strict decimal integer parser: ok(value), or err for empty / non-numeric / leading zeros. */
export function parse_int_safe(s: string): ParseResult {
  if (s.length === 0) return err('empty string');
  const neg = s[0] === '-';
  const body = neg ? s.slice(1) : s;
  if (body.length === 0) return err('no digits');
  if (!/^[0-9]+$/.test(body)) return err('non-numeric character');
  if (body.length > 1 && body[0] === '0') return err('leading zeros');
  const value = parseInt(body, 10);
  return ok(neg ? -value : value);
}
