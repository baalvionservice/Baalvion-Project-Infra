import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Pricing | Baalvion Connect',
  description: 'Choose the right Baalvion Connect plan for your brand or creator business. Transparent pricing with no hidden fees — from a free starter tier to enterprise-grade AI matching.',
  path: '/pricing',
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
