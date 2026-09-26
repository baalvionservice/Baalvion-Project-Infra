type ImperialpediaMarkProps = {
  className?: string;
};

const VIOLET = '#7C3AED';

/**
 * Brand mark — three ascending bars with a violet node, reading as both a
 * rising market chart and an "imperial" ascent. Bars use `currentColor` so
 * the mark tracks the app's light/dark theme via the surrounding text color.
 */
export function ImperialpediaMark({ className }: ImperialpediaMarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="10" y="38" width="9" height="18" fill="currentColor" />
      <rect x="24.5" y="27" width="9" height="29" fill="currentColor" />
      <rect x="39" y="14" width="9" height="42" fill="currentColor" />
      <circle cx="43.5" cy="7" r="6" fill={VIOLET} />
    </svg>
  );
}
