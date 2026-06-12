import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Institutional Onboarding | Baalvion',
  description: 'Complete your institutional onboarding to access Baalvion investor relations content, capital operations, and governance materials.',
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
