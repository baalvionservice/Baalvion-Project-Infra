import type { Metadata } from 'next';
import { getMergedCourtBySlug } from '@/lib/legal-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const court = await getMergedCourtBySlug(slug);
  const url = `${SITE}/legal/courts/${slug}`;

  if (!court) {
    return { title: `${titleCase(slug)} | Law Elite Network`, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  return {
    title: court.name,
    description: court.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title: court.name, description: court.description },
    twitter: { card: 'summary', title: court.name, description: court.description },
  };
}

export default function CourtLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
