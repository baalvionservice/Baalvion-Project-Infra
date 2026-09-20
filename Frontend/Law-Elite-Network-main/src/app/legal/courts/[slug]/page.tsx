import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { CourtProfile } from '@/components/legal/CourtProfile';
import { getMergedCourtBySlug, getMergedCasesForCourt, getLatestNewsForCourt } from '@/lib/legal-server';
import { getAllCourts } from '@/data/courts';

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllCourts().map((c) => ({ slug: c.slug }));
}

export default async function CourtPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const court = await getMergedCourtBySlug(slug);
  if (!court) notFound();

  const [cases, latestNews] = await Promise.all([
    getMergedCasesForCourt(slug),
    getLatestNewsForCourt(slug),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <CourtProfile court={court} cases={cases} latestNews={latestNews} />
      </main>
      <PublicFooter />
    </div>
  );
}
