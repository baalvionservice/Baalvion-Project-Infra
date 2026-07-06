import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Affiliate Disclosure';
const description = "Where referral fees or compensated placements exist on Law Elite Network, and why they never influence our Verified designations or editorial coverage.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/affiliate-disclosure` },
  openGraph: { type: 'website', url: `${SITE}/affiliate-disclosure`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
