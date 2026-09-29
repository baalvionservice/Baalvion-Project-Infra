import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

// Transactional auth flow — never index.
export const metadata: Metadata = generateMetadata({
  title: 'Reset Password | Baalvion Connect',
  description: 'Request a password reset link for your Baalvion Connect account.',
  path: '/auth/forgot-password',
  noIndex: true,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
