import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

// Onboarding is a private, post-signup flow — keep it out of the index.
export const metadata: Metadata = generateMetadata({
  title: 'Get Started | Baalvion Connect',
  description: 'Complete your Baalvion Connect onboarding to start matching with brands or creators.',
  path: '/onboarding',
  noIndex: true,
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
