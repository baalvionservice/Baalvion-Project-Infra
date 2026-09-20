import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { CaseProfile } from '@/components/legal/CaseProfile';
import { getMergedLegalCaseBySlug, getMergedCourtBySlug, getLatestNewsForCase, getResolvedCaseParticipants } from '@/lib/legal-server';
import { getAllLegalCases } from '@/data/legal-cases';

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllLegalCases().map((c) => ({ slug: c.slug }));
}

export default async function LegalCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legalCase = await getMergedLegalCaseBySlug(slug);
  if (!legalCase) notFound();

  const [court, latestNews] = await Promise.all([
    getMergedCourtBySlug(legalCase.courtSlug),
    getLatestNewsForCase(legalCase),
  ]);
  const peopleBySlug = getResolvedCaseParticipants(legalCase);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <CaseProfile legalCase={legalCase} court={court} peopleBySlug={peopleBySlug} latestNews={latestNews} />
      </main>
      <PublicFooter />
    </div>
  );
}
