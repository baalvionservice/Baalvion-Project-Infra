import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Contact Us';
const description = "Contact Law Elite Network — reach our team for support, partnerships, or help finding the right verified lawyer anywhere in the world.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/contact-us` },
  openGraph: { type: 'website', url: `${SITE}/contact-us`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
