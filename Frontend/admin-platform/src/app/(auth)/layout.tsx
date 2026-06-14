import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import BaalvionMark from '@/components/auth/BaalvionMark';
import './auth-experience.css';

export const metadata: Metadata = { title: 'Sign In' };

export default function AuthLayout({ children }: { children: ReactNode }) {
  const year = 2026;
  return (
    <div className="bv-stage">
      <AnimatedBackground />

      <div className="bv-content">
        <div className="mb-8 bv-reveal">
          <BaalvionMark size={48} />
        </div>

        {children}

        <p className="mt-7 max-w-sm text-center text-[0.72rem] leading-relaxed text-[--bv-ink-dim]">
          Secured institutional access · End-to-end encrypted · Mission-control grade
        </p>
      </div>

      <div className="bv-footer">
        Baalvion Industries Private Limited · © {year} · Trade — Finance — AI — Infrastructure
      </div>
    </div>
  );
}
