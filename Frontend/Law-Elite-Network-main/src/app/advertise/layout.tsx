import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Advertise With Us';
const description = "Reach a global audience of legal professionals and clients on Law Elite Network. Advertising and partnership opportunities.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/advertise` },
  openGraph: { type: 'website', url: `${SITE}/advertise`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
