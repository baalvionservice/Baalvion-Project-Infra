import type { ReactNode } from 'react';

type Bg = 'ink' | 'ink-deep' | 'surface';
type Pad = 'section' | 'monument' | 'dense';

interface SectionShellProps {
  id: string;
  folio: string;
  label: string;
  ghost?: string;
  bg?: Bg;
  pad?: Pad;
  /** Render the continuous left spine through this band (default true). */
  spine?: boolean;
  /** Center the content column (closing only). */
  center?: boolean;
  labelledBy: string;
  children: ReactNode;
}

const BG: Record<Bg, string> = {
  ink: 'bg-ink',
  'ink-deep': 'bg-ink-deep',
  surface: 'bg-surface',
};

const PAD: Record<Pad, string> = {
  section: 'pad-section',
  monument: 'pad-monument',
  dense: 'pad-dense',
};

/**
 * The ledger frame shared by every numbered section: an edge-to-edge hairline
 * divider, the spine running through it, an engraved plate folio that "cuts"
 * the divider, and an optional concrete ghost numeral behind the running head.
 */
export function SectionShell({
  id,
  folio,
  label,
  ghost,
  bg = 'ink',
  pad = 'section',
  spine = true,
  center = false,
  labelledBy,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative border-t hairline-strong ${BG[bg]}`}
    >
      <div className="site-container">
        {spine && <span className="spine" aria-hidden="true" />}
        <p className="plate">
          <span className="plate-index">{folio}</span>
          <span>{label}</span>
        </p>
        <div className={`ledger-content ${PAD[pad]} ${center ? 'lg:!pl-0 text-center' : ''}`}>
          {ghost && !center && (
            <span className="ghost-numeral" aria-hidden="true">
              {ghost}
            </span>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
