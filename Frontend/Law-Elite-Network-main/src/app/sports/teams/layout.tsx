import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Teams';
const description = 'Teams referenced across Law Elite Network’s sports coverage.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/sports/teams` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/sports/teams`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
