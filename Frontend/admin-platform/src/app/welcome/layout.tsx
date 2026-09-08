import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import BaalvionMark from '@/components/auth/BaalvionMark';
import MarketTicker from '@/components/auth/MarketTicker';
import '../(auth)/auth-experience.css';

export const metadata: Metadata = { title: 'Welcome' };

export default function WelcomeLayout({ children }: { children: ReactNode }) {
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

      <div className="bv-terminal-shell bv-terminal-shell--single">
        <main className="bv-terminal-main">{children}</main>
      </div>

      <footer className="bv-footer">
        Baalvion Industries Private Limited · © {year} · Trade — Finance — AI — Infrastructure
      </footer>
    </div>
  );
}
