import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Find the perfect plan for your hiring needs. Start with a free trial — no credit card required. Choose from Basic, Pro, or Enterprise pricing.',
  alternates: {
    canonical: 'https://controlthemarket.com/pricing',
  },
  openGraph: {
    url: 'https://controlthemarket.com/pricing',
    title: 'Pricing | ControlTheMarket',
    description:
      'Find the perfect plan for your hiring needs. Start with a free trial — no credit card required.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
