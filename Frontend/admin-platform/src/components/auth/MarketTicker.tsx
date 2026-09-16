/**
 * Masthead ticker — the group's operating domains on a broadcast-style crawl.
 * Pure CSS marquee (no JS loop), safe in a Server Component. Items are duplicated
 * once so the -50% translate loops seamlessly.
 */

const SEGMENTS = [
  'Trade',
  'Finance',
  'AI',
  'Infrastructure',
  'Identity',
  'Platform',
  'Commerce',
  'Knowledge',
  'Ecosystem',
];

export default function MarketTicker() {
  return (
    <div className="bv-ticker" aria-hidden="true">
      <div className="bv-ticker__track">
        {[...SEGMENTS, ...SEGMENTS].map((segment, i) => (
          <span key={`${segment}-${i}`} className="bv-ticker__item">
            <span className="bv-ticker__dot" />
            {segment}
          </span>
        ))}
      </div>
    </div>
  );
}
