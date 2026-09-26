import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'People — Actors, Musicians, Athletes & Lawyers';
const description =
  'Reference profiles for notable actors, musicians, athletes, lawyers, judges, creators and other public figures on Law Elite Network.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['celebrity profiles', 'public figures', 'actors', 'musicians', 'athletes', 'lawyers', 'judges', 'law elite network people'],
  alternates: { canonical: `${SITE}/people` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/people`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
