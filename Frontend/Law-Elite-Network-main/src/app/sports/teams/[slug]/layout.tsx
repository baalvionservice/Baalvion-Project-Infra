import type { Metadata } from 'next';
import { getMergedSportsTeamBySlug } from '@/lib/sports-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const team = await getMergedSportsTeamBySlug(slug);
  const url = `${SITE}/sports/teams/${slug}`;

  if (!team) {
    return { title: `${titleCase(slug)} | Law Elite Network`, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  return {
    title: team.name,
    description: team.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title: team.name, description: team.description },
    twitter: { card: 'summary', title: team.name, description: team.description },
  };
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
