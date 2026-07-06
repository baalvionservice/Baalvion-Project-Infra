import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Accessibility Statement';
const description = "Law Elite Network's commitment to WCAG 2.2 AA accessibility, our ongoing improvement process, and how to report an accessibility barrier on the site.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/accessibility` },
  openGraph: { type: 'website', url: `${SITE}/accessibility`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
