import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'About Us';
const description = "Law Elite Network is an independent legal-information and education publisher helping readers understand laws, rights, and legal concepts across jurisdictions. Learn about our mission.";
export const metadata: Metadata = {
  title,
  description,
  keywords: ['about law elite network', 'legal knowledge platform', 'legal education publisher', 'law elite network mission'],
  alternates: { canonical: `${SITE}/about-us` },
  openGraph: { type: 'website', url: `${SITE}/about-us`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
