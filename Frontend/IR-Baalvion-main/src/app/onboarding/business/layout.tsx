import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Business Onboarding | Baalvion',
  description: 'Onboard your business with Baalvion — company registration, KYC, IEC/GST/VAT verification, document upload and compliance approval.',
  robots: { index: false, follow: false },
};

export default function BusinessOnboardingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
