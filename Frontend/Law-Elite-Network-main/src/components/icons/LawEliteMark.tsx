type LawEliteMarkProps = {
  className?: string;
  variant?: 'navy' | 'white';
};

const GOLD = '#C8A24A';

/**
 * Brand mark — a balance beam reduced to four flat shapes (beam, stem,
 * fulcrum, two pans). `navy` variant is for light backgrounds, `white` for
 * placement on the brand navy itself (header chip, footer-on-navy).
 */
export function LawEliteMark({ className, variant = 'navy' }: LawEliteMarkProps) {
  const ink = variant === 'navy' ? '#0F2440' : '#F6F4EF';
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="10" y="16" width="44" height="4" fill={ink} />
      <rect x="30" y="20" width="4" height="24" fill={ink} />
      <polygon points="22,52 42,52 32,44" fill={ink} />
      <rect x="14" y="20" width="3" height="11" fill={ink} />
      <rect x="47" y="20" width="3" height="11" fill={ink} />
      <circle cx="15.5" cy="35" r="7" fill={GOLD} />
      <circle cx="48.5" cy="35" r="7" fill={GOLD} />
    </svg>
  );
}
