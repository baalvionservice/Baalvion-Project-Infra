import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Sign In | Baalvion Connect',
  description: 'Sign in to your Baalvion Connect account to manage campaigns, discover creators, and track your marketing performance.',
  path: '/auth/login',
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
