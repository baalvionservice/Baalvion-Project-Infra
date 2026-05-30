import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Plans & Pricing';
const description = "Choose a Law Elite Network plan — flexible options for clients and verified lawyers. Access elite legal counsel across 188 countries.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/plans` },
  openGraph: { type: 'website', url: `${SITE}/plans`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
