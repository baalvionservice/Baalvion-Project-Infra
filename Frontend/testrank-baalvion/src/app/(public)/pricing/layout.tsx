import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Find the perfect plan for your hiring needs. Start with a free trial — no credit card required. Choose from Basic, Pro, or Enterprise pricing.',
  alternates: {
    canonical: absoluteUrl('/pricing'),
  },
  openGraph: {
    url: absoluteUrl('/pricing'),
    title: 'Pricing | ControlTheMarket',
    description:
      'Find the perfect plan for your hiring needs. Start with a free trial — no credit card required.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
