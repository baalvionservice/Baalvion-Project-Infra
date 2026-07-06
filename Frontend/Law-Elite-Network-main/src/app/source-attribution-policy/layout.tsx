import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Source Attribution Policy';
const description = "How Law Elite Network cites primary legal sources versus secondary commentary, our standard for authoritative sourcing, and why article dates matter.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/source-attribution-policy` },
  openGraph: { type: 'website', url: `${SITE}/source-attribution-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
