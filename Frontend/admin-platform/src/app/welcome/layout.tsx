import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import '../(auth)/auth-experience.css';

export const metadata: Metadata = { title: 'Welcome' };

export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bv-stage">
      <AnimatedBackground />
      {children}
    </div>
  );
}
