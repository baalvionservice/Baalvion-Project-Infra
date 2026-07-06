import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Sponsored Content Policy';
const description = "How Law Elite Network labels sponsored posts and featured placements, holds them to the same editorial bar, and distinguishes Verified status from paid placement.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/sponsored-content-policy` },
  openGraph: { type: 'website', url: `${SITE}/sponsored-content-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
