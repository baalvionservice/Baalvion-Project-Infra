import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Diversity Policy';
const description = "Law Elite Network's commitment to representing diverse practice areas, jurisdictions, and voices across our legal commentary and lawyer directory.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/diversity-policy` },
  openGraph: { type: 'website', url: `${SITE}/diversity-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
