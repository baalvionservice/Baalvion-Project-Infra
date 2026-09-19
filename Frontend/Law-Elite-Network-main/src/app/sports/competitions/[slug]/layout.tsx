import type { Metadata } from 'next';
import { getMergedSportsCompetitionBySlug } from '@/lib/sports-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getMergedSportsCompetitionBySlug(slug);
  const url = `${SITE}/sports/competitions/${slug}`;

  if (!competition) {
    return { title: `${titleCase(slug)} | Law Elite Network`, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  return {
    title: competition.name,
    description: competition.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title: competition.name, description: competition.description },
    twitter: { card: 'summary', title: competition.name, description: competition.description },
  };
}

export default function CompetitionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
