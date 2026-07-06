import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Editorial Standards';
const description = "How Law Elite Network researches, writes, fact-checks, reviews, and updates its legal content — and why our articles are general information, not legal advice.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/editorial-standards` },
  openGraph: { type: 'website', url: `${SITE}/editorial-standards`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
