import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lawelitenetwork.com';
const title = 'Diversity Policy';
const description = "Law Elite Network's commitment to representing diverse subjects, traditions, and voices across our coverage and contributor roster.";
export const metadata: Metadata = {
  title,
  description,
  keywords: ['diversity policy', 'inclusion in legal directory', 'diverse legal voices', 'law elite network commitments'],
  alternates: { canonical: `${SITE}/diversity-policy` },
  openGraph: { type: 'website', url: `${SITE}/diversity-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
