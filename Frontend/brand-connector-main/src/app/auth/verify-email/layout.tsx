import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

// Transactional auth flow (token-gated) — never index.
export const metadata: Metadata = generateMetadata({
  title: 'Verify Email | Baalvion Connect',
  description: 'Confirm your email address to activate your Baalvion Connect account.',
  path: '/auth/verify-email',
  noIndex: true,
});

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
