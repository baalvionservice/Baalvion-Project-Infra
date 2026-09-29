/**
 * Baalvion auth background — abstract global data-network, drifting aurora, and
 * floating particles. Pure CSS/SVG (no JS animation loop), safe in a Server Component.
 */

// Deterministic node positions (viewBox 0 0 1000 600) — abstract trade hubs.
const NODES: ReadonlyArray<readonly [number, number]> = [
  [120, 180], [260, 110], [400, 220], [540, 130], [690, 250],
  [820, 160], [930, 300], [180, 360], [330, 440], [500, 380],
  [650, 470], [780, 400], [880, 480], [70, 470], [420, 540],
];

// Curved links between hubs (great-circle-ish arcs) → animated dash "trade flow".
const LINKS: ReadonlyArray<{ d: string; cls: string }> = [
  { d: 'M120 180 Q300 40 540 130', cls: 'bv-net__line' },
  { d: 'M540 130 Q760 60 930 300', cls: 'bv-net__line bv-net__line--2' },
  { d: 'M120 180 Q260 340 500 380', cls: 'bv-net__line bv-net__line--3' },
  { d: 'M500 380 Q680 300 880 480', cls: 'bv-net__line bv-net__line--4' },
  { d: 'M260 110 Q420 320 650 470', cls: 'bv-net__line bv-net__line--5' },
  { d: 'M70 470 Q300 520 420 540', cls: 'bv-net__line bv-net__line--2' },
  { d: 'M400 220 Q560 260 780 400', cls: 'bv-net__line bv-net__line--3' },
  { d: 'M690 250 Q800 360 880 480', cls: 'bv-net__line bv-net__line--4' },
];

// Stable particle layout (left%, delay s, duration s, size px).
const PARTICLES: ReadonlyArray<readonly [number, number, number, number]> = [
  [8, 0, 15, 3], [18, 4, 18, 2], [27, 9, 13, 4], [36, 2, 16, 2],
  [45, 6, 20, 3], [54, 11, 14, 2], [63, 1, 17, 3], [72, 7, 19, 4],
  [81, 3, 15, 2], [90, 8, 21, 3], [13, 12, 16, 2], [49, 14, 18, 3],
  [68, 5, 22, 2], [95, 10, 14, 4],
];

export default function AnimatedBackground() {
  return (
    <div className="bv-bg" aria-hidden="true">
      <div className="bv-aurora bv-aurora--a" />
      <div className="bv-aurora bv-aurora--b" />
      <div className="bv-aurora bv-aurora--c" />

      <svg className="bv-net" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="bvNetGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        {/* faint static lattice */}
        {LINKS.map((l, i) => (
          <path key={`base-${i}`} d={l.d} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        {/* animated trade flow */}
        {LINKS.map((l, i) => (
          <path key={`flow-${i}`} className={l.cls} d={l.d} />
        ))}
        {NODES.map(([cx, cy], i) => (
          <circle
            key={`node-${i}`}
            className="bv-net__node"
            cx={cx}
            cy={cy}
            r={2.4}
            style={{ animationDelay: `${(i % 5) * 0.6}s`, transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
      </svg>

      <div className="bv-particles">
        {PARTICLES.map(([left, delay, dur, size], i) => (
          <span
            key={i}
            className="bv-particle"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
          />
        ))}
      </div>

      <div className="bv-grid" />
      <div className="bv-vignette" />
    </div>
  );
}
