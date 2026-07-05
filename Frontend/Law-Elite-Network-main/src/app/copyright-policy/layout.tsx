import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Copyright Policy';
const description = "What Law Elite Network owns versus public-domain legal sources, permitted quotation and attribution, prohibited scraping or republishing, and how to request a license.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/copyright-policy` },
  openGraph: { type: 'website', url: `${SITE}/copyright-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
