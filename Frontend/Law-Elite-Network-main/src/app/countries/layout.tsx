import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Countries';
const description = 'People, cases, and coverage connected to each country on Law Elite Network.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/countries` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/countries`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function CountriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
