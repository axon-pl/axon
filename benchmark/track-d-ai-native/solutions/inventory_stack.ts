export interface Item {
  name: string;
  count: number;
}

/** Merge stackable items by name (first-seen order), then split into stacks of at most maxSize. */
export function inventory_stack(items: Item[], maxSize: number): Item[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.name, (totals.get(item.name) ?? 0) + item.count);
  }
  const result: Item[] = [];
  for (const [name, total] of totals) {
    let remaining = total;
    while (remaining > 0) {
      const take = Math.min(remaining, maxSize);
      result.push({ name, count: take });
      remaining -= take;
    }
  }
  return result;
}
