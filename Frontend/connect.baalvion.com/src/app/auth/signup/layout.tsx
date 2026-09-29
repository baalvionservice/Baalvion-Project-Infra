import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Create Account | Baalvion Connect',
  description: 'Join Baalvion Connect as a brand or creator. Start running AI-powered influencer campaigns or monetize your creativity with top global brands.',
  path: '/auth/signup',
  noIndex: true,
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
