import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Terms of Service';
const description = "Law Elite Network terms of service governing use of the platform.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/terms-of-service` },
  openGraph: { type: 'website', url: `${SITE}/terms-of-service`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
