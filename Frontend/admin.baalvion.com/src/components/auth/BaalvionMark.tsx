/**
 * Animated premium logo placeholder for Baalvion Industries.
 * Orbital hex-ring glyph + gradient wordmark. Pure SVG/CSS (Server Component safe).
 */

interface BaalvionMarkProps {
  size?: number;
  withWordmark?: boolean;
}

export default function BaalvionMark({ size = 44, withWordmark = true }: BaalvionMarkProps) {
  return (
    <div className="bv-mark">
      <div className="bv-mark__glyph" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="bvMarkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="55%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <radialGradient id="bvMarkCore" cx="50%" cy="42%" r="60%">
              <stop offset="0%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#3b82f6" />
            </radialGradient>
          </defs>

          {/* outer hex ring — slow spin */}
          <g className="bv-mark__ring" style={{ transformOrigin: '50px 50px' }}>
            <polygon
              points="50,6 88,28 88,72 50,94 12,72 12,28"
              stroke="url(#bvMarkGrad)"
              strokeWidth={2.5}
              fill="none"
              opacity={0.9}
            />
          </g>
          {/* inner counter-rotating ring */}
          <g className="bv-mark__ring--rev" style={{ transformOrigin: '50px 50px' }}>
            <circle cx="50" cy="50" r="30" stroke="url(#bvMarkGrad)" strokeWidth={1} fill="none" opacity={0.4} strokeDasharray="4 7" />
            <circle className="bv-mark__core" cx="50" cy="20" r="3" fill="#93c5fd" />
          </g>

          {/* core monogram */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="42"
            fontWeight="700"
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            fill="url(#bvMarkCore)"
            className="bv-mark__core"
          >
            B
          </text>
        </svg>
      </div>

      {withWordmark && (
        <div className="bv-wordmark">
          <div className="bv-wordmark__name" style={{ fontSize: size * 0.42 }}>
            BAALVION
          </div>
          <div className="bv-wordmark__sub">Industries · Pvt. Ltd.</div>
        </div>
      )}
    </div>
  );
}
