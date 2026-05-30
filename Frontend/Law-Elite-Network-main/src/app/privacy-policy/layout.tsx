import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Privacy Policy';
const description = "Law Elite Network privacy policy — how we collect, use, and protect your data.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/privacy-policy` },
  openGraph: { type: 'website', url: `${SITE}/privacy-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
