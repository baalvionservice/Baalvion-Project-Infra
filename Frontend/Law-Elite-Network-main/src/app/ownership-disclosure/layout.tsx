import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Ownership Disclosure';
const description = "Who operates Law Elite Network, who is legally responsible for its content and lawyer-matching service, and our policy against undisclosed outside influence.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/ownership-disclosure` },
  openGraph: { type: 'website', url: `${SITE}/ownership-disclosure`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
