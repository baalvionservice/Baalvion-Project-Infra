interface WordmarkProps {
  className?: string;
}

/** Baalvion wordmark — three-bar layer mark (top bar = the one permitted accent) + set type. */
export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="1" y="2" width="16" height="3" fill="hsl(var(--accent))" />
        <rect x="1" y="7.5" width="12" height="3" fill="currentColor" />
        <rect x="1" y="13" width="16" height="3" fill="currentColor" />
      </svg>
      <span className="font-sans text-base font-semibold uppercase tracking-[0.22em]">
        Baalvion
      </span>
    </span>
  );
}
