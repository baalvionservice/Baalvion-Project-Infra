import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

// Transactional auth flow (token-gated) — never index.
export const metadata: Metadata = generateMetadata({
  title: 'Set New Password | Baalvion Connect',
  description: 'Set a new password for your Baalvion Connect account.',
  path: '/auth/reset-password',
  noIndex: true,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
