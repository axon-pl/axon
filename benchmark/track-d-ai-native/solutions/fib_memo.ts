const cache = new Map<number, number>();

/** Memoized fibonacci; fib(0)=0, fib(1)=1, negative input treated as 0. */
export function fib(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  const hit = cache.get(n);
  if (hit !== undefined) return hit;
  const value = fib(n - 1) + fib(n - 2);
  cache.set(n, value);
  return value;
}
