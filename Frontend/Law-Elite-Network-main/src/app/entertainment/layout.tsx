import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Entertainment — Movies, TV, Music & Awards';
const description =
  'Reference entries for movies, TV shows, streaming shows, music releases, albums, songs, awards, and entertainment events on Law Elite Network, including the people involved in each.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['movies', 'tv shows', 'streaming shows', 'albums', 'songs', 'awards', 'entertainment events', 'law elite network entertainment'],
  alternates: { canonical: `${SITE}/entertainment` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/entertainment`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function EntertainmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
