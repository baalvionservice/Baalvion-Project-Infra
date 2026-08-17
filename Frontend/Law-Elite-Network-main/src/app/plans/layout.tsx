import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Plans & Pricing';
const description = "Compare Law Elite Network membership plans — flexible options for clients and legal professionals accessing guides, tools, and network features.";
export const metadata: Metadata = {
  title,
  description,
  keywords: ['law elite network pricing', 'legal subscription plans', 'lawyer membership plans', 'legal consultation plans'],
  alternates: { canonical: `${SITE}/plans` },
  openGraph: { type: 'website', url: `${SITE}/plans`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
