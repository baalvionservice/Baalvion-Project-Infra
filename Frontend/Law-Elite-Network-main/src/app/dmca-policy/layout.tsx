import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'DMCA Policy';
const description = "Law Elite Network's notice-and-takedown procedure under 17 U.S.C. § 512, how to file a valid DMCA notice, counter-notification steps, and our repeat infringer policy.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/dmca-policy` },
  openGraph: { type: 'website', url: `${SITE}/dmca-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
