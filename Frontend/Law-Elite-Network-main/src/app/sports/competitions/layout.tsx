import type { Metadata } from 'next';
import { brandTitle } from '@/lib/seo/brand-title';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Sports Competitions';
const description = 'Competitions and events referenced across Law Elite Network’s sports coverage.';

export const metadata: Metadata = {
  title: { absolute: brandTitle(title) },
  description,
  alternates: { canonical: `${SITE}/sports/competitions` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/sports/competitions`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
