import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Sports — Athletes, Teams & Competitions';
const description = 'Athlete profiles, teams, and competitions covered across Law Elite Network.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['athletes', 'sports teams', 'sports competitions', 'law elite network sports'],
  alternates: { canonical: `${SITE}/sports` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/sports`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
