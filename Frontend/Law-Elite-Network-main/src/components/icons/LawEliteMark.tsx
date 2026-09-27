type LawEliteMarkProps = {
  className?: string;
  variant?: 'navy' | 'white';
};

/**
 * Brand mark — a balance beam reduced to flat shapes (beam, post, base,
 * two solid pans). `navy` variant is for light backgrounds, `white` for
 * placement on the brand navy itself (header chip, footer-on-navy). Single
 * ink color throughout (no separate gold accent) to match the header/
 * footer/favicon mark exactly.
 */
export function LawEliteMark({ className, variant = 'navy' }: LawEliteMarkProps) {
  const ink = variant === 'navy' ? '#0F2440' : '#F6F4EF';
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="8" y="18" width="48" height="5" fill={ink} />
      <rect x="29" y="22" width="6" height="24" fill={ink} />
      <rect x="21" y="46" width="22" height="5" fill={ink} />
      <rect x="12" y="23" width="2.5" height="9" fill={ink} />
      <rect x="49.5" y="23" width="2.5" height="9" fill={ink} />
      <path d="M3,32 a10,9 0 0 0 20,0 z" fill={ink} />
      <path d="M41,32 a10,9 0 0 0 20,0 z" fill={ink} />
    </svg>
  );
}
