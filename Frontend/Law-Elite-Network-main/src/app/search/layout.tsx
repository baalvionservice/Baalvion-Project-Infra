import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Search Lawyers & Legal Resources';
const description = "Search verified lawyers and expert legal articles across 188 countries on Law Elite Network.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/search` },
  openGraph: { type: 'website', url: `${SITE}/search`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
