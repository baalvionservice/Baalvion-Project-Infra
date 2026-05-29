import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Find a Lawyer — Global Legal Directory';
const description =
  'Discover and connect with verified lawyers across 188 countries. Search elite, vetted legal practitioners by country, practice area, rating and fee on Law Elite Network.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['find a lawyer', 'global lawyer directory', 'international lawyers', 'legal consultation', 'attorney directory', 'verified lawyers'],
  alternates: { canonical: `${SITE}/lawyers` },
  openGraph: { type: 'website', url: `${SITE}/lawyers`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function LawyersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
