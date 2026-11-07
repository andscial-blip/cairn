/** Exponential backoff with full jitter: 2s, 4s, 8s … capped at 15 min. */
export function nextDelayMs(attempts: number, rand: () => number = Math.random): number {
  const base = 2000, cap = 15 * 60 * 1000;
  const exp = Math.min(cap, base * 2 ** Math.max(0, attempts - 1));
  return Math.round(exp / 2 + rand() * (exp / 2));
}
