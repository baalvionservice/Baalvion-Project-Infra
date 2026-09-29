import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import BaalvionMark from '@/components/auth/BaalvionMark';
import MarketTicker from '@/components/auth/MarketTicker';
import './auth-experience.css';

export const metadata: Metadata = { title: 'Sign In' };

const DOMAINS = ['Identity', 'Platform', 'Commerce', 'Knowledge', 'Ecosystem', 'Infrastructure'];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const year = 2026;
  return (
    <div className="bv-stage bv-stage--terminal">
      <AnimatedBackground />

      <header className="bv-masthead">
        <div className="bv-masthead__brand">
          <BaalvionMark size={30} />
        </div>
        <span className="bv-masthead__rule" />
        <MarketTicker />
      </header>

      <div className="bv-terminal-shell">
        <aside className="bv-rail">
          <span className="bv-rail__eyebrow">
            <span className="bv-dot-live bv-dot-live--red" />
            Admin terminal
          </span>

          <h2 className="bv-rail__title">
            The control plane for <em>Baalvion Industries</em>
          </h2>

          <span className="bv-rail__divider" />

          <p className="bv-rail__lede">
            One console for the group&rsquo;s operating stack — trade, finance, AI and
            infrastructure — behind a single identity and one permission model.
          </p>

          <div className="bv-domains">
            {DOMAINS.map((domain) => (
              <span key={domain} className="bv-domain">
                {domain}
              </span>
            ))}
          </div>
        </aside>

        <main className="bv-terminal-main">{children}</main>
      </div>

      <footer className="bv-footer">
        Baalvion Industries Private Limited · © {year} · Trade — Finance — AI — Infrastructure
      </footer>
    </div>
  );
}
