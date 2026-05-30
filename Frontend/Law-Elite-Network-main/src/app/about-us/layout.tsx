import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'About Us';
const description = "Law Elite Network is the global platform connecting verified lawyers across 188 countries with clients seeking trusted legal counsel. Learn about our mission.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/about-us` },
  openGraph: { type: 'website', url: `${SITE}/about-us`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
