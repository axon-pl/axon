// Benchmark: Error handling with propagation
type Result<T> =
  | { ok: true;  value: T }
  | { ok: false; error: string };

function parseAge(s: string): Result<number> {
  const n = parseInt(s, 10);
  if (isNaN(n))  return { ok: false, error: `Not a number: ${s}` };
  if (n < 0)     return { ok: false, error: `Age cannot be negative: ${n}` };
  if (n > 150)   return { ok: false, error: `Unlikely age: ${n}` };
  return { ok: true, value: n };
}

interface User { name: string; age: number; }

function validateUser(name: string, ageStr: string): Result<User> {
  if (name.length === 0) return { ok: false, error: "Name cannot be empty" };
  const ageResult = parseAge(ageStr);
  if (!ageResult.ok) return ageResult;
  return { ok: true, value: { name, age: ageResult.value } };
}

function process(name: string, ageStr: string): string {
  const result = validateUser(name, ageStr);
  if (result.ok) return `Valid: ${result.value.name}, age ${result.value.age}`;
  return `Error: ${result.error}`;
}

console.log(process("Alice", "30"));
console.log(process("Bob",   "abc"));
console.log(process("",      "25"));
console.log(process("Diana", "-5"));
console.log(process("Eve",   "200"));
