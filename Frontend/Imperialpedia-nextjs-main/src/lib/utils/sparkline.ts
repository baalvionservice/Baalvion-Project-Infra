/** Deterministic decorative sparkline (not a real price/data series) — a small,
 * stable zigzag biased in the metric's real up/down direction, purely to give
 * a snapshot card visual texture. Render with aria-hidden so it never reads to
 * assistive tech as an actual data chart. Shared by MarketSnapshot and
 * EconomicSnapshot. */
export function sparklinePoints(seed: string, positive: boolean, width = 64, height = 22, steps = 6): string {
  let state = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 7);
  const next = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  let y = height / 2;
  const points: string[] = [];
  for (let i = 0; i < steps; i++) {
    const x = (width / (steps - 1)) * i;
    const drift = positive ? -1 : 1; // SVG y grows downward, so "up" means smaller y.
    y = Math.min(height - 2, Math.max(2, y + drift * next() * 3.5 + (next() - 0.5) * 2));
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}
