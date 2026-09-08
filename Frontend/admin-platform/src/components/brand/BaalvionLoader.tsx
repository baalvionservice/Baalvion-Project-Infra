/**
 * Branded loading state — the Baalvion hex mark with a red tracing arc, in the same
 * language as the sign-in screen. Pure SVG/CSS (no JS loop), safe in a Server Component
 * so it can back a route-level loading.tsx. Keyframes live in globals.css (bvl-*).
 */

interface BaalvionLoaderProps {
  /** Mark size in px. Defaults to 52 inline, 104 when `full`. */
  size?: number;
  /** Caption under the mark. Pass null for the mark alone. */
  label?: string | null;
  /** Centre in the full routed area rather than sitting inline. */
  full?: boolean;
}

export default function BaalvionLoader({
  size: sizeProp,
  label = 'Loading',
  full = false,
}: BaalvionLoaderProps) {
  // A whole-screen wait carries a bigger mark than an inline one.
  const size = sizeProp ?? (full ? 104 : 52);
  const mark = (
    <div className="bvl" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        {/* static lattice */}
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          stroke="currentColor"
          strokeWidth={2}
          fill="none"
          className="bvl__frame"
        />
        {/* red arc tracing the hex */}
        <g className="bvl__spin" style={{ transformOrigin: '50px 50px' }}>
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            stroke="#e0122c"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="34 210"
          />
        </g>
        <text
          x="50"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="34"
          fontWeight="700"
          fontFamily="var(--font-geist-sans), system-ui, sans-serif"
          fill="currentColor"
          className="bvl__monogram"
        >
          B
        </text>
      </svg>
    </div>
  );

  const body = (
    <div className={full ? 'flex flex-col items-center gap-6' : 'flex flex-col items-center gap-4'}>
      {mark}
      {label !== null && (
        <div className="flex flex-col items-center gap-3">
          <span
            className={
              full
                ? 'text-sm font-semibold uppercase tracking-[0.26em] text-foreground/80'
                : 'text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground'
            }
          >
            {label}
          </span>
          <span className="bvl__bar" style={full ? { width: size * 1.9 } : undefined} />
        </div>
      )}
    </div>
  );

  if (!full) return body;

  // h-full centres it in the routed area; the min-h keeps it centred if that area
  // has no definite height of its own.
  return (
    <div className="flex h-full min-h-[70vh] w-full items-center justify-center">{body}</div>
  );
}
