/** Deterministic djb2 string hash → unsigned 32-bit integer. Same input always yields the same output. */
export function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Deterministically pick one item from a non-empty array using a seed string. */
export function pick<T>(items: readonly T[], seed: string, salt = ''): T {
  const h = djb2(`${seed}:${salt}`);
  return items[h % items.length];
}

/** Deterministically pick `count` distinct items from a non-empty array using a seed string. */
export function pickMany<T>(items: readonly T[], seed: string, count: number, salt = ''): T[] {
  if (count >= items.length) return [...items];
  const h = djb2(`${seed}:${salt}`);
  const startIndex = h % items.length;
  const step = 1 + (Math.floor(h / items.length) % (items.length - 1 || 1));
  const out: T[] = [];
  const seen = new Set<number>();
  let idx = startIndex;
  while (out.length < count) {
    if (!seen.has(idx)) {
      seen.add(idx);
      out.push(items[idx]);
    }
    idx = (idx + step) % items.length;
  }
  return out;
}
