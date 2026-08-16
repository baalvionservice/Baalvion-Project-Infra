import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Cookie Policy';
const description = "How Law Elite Network uses strictly necessary, analytics, and advertising cookies, and how readers can control cookie preferences in their browser.";
export const metadata: Metadata = {
  title,
  description,
  keywords: ['law elite network cookie policy', 'cookie preferences', 'website cookies', 'advertising cookies'],
  alternates: { canonical: `${SITE}/cookie-policy` },
  openGraph: { type: 'website', url: `${SITE}/cookie-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
