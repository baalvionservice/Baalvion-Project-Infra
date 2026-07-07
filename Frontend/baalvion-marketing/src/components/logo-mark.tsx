type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = '' }: LogoMarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect width="26" height="26" rx="7" fill="url(#logo-gradient)" />
        <path
          d="M7 17.5V8.5L13 12.2L19 8.5V17.5"
          stroke="hsl(224 45% 6%)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="26" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(255 90% 66%)" />
            <stop offset="1" stopColor="hsl(189 94% 55%)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">Baalvion</span>
    </span>
  );
}
