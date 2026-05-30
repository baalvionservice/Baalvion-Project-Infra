import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Editorial Process';
const description = "How Law Elite Network produces accurate, expert-reviewed legal content — our editorial standards and review process.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/editorial-process` },
  openGraph: { type: 'website', url: `${SITE}/editorial-process`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
