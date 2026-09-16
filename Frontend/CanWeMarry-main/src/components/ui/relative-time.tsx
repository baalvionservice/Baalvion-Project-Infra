const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000_000],
  ['month', 2_592_000_000],
  ['week', 604_800_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/**
 * Renders a <time> with a relative label and the exact value in the title attribute.
 *
 * Computed from a fixed instant on the server so the markup is deterministic — a value
 * recomputed on the client would differ by the round-trip and trip a hydration mismatch.
 */
export function RelativeTime({ value, className }: { value: string; className?: string }) {
  const then = new Date(value);
  const diff = then.getTime() - Date.now();
  const abs = Math.abs(diff);

  let label = 'just now';
  for (const [unit, ms] of UNITS) {
    if (abs >= ms) {
      label = new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(diff / ms), unit);
      break;
    }
  }

  return (
    <time dateTime={value} title={then.toLocaleString()} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}
