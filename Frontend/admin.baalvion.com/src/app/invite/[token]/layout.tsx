import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import '../../(auth)/auth-experience.css';

export const metadata: Metadata = { title: 'Your Invitation' };

export default function InviteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bv-stage">
      <AnimatedBackground />
      {children}
    </div>
  );
}
