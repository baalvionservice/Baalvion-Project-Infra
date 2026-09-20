import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { CaseProfile } from '@/components/legal/CaseProfile';
import { getMergedPeople } from '@/lib/people-server';
import { getMergedLegalCaseBySlug, getMergedLegalCases, getMergedCourtBySlug, getLatestNewsForCase, getResolvedCaseParticipants } from '@/lib/legal-server';

export const revalidate = 86400;

export async function generateStaticParams() {
  return (await getMergedLegalCases()).map((c) => ({ slug: c.slug }));
}

export default async function LegalCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legalCase = await getMergedLegalCaseBySlug(slug);
  if (!legalCase) notFound();

  const [court, latestNews] = await Promise.all([
    getMergedCourtBySlug(legalCase.courtSlug),
    getLatestNewsForCase(legalCase),
  ]);
  const peopleBySlug = getResolvedCaseParticipants(legalCase, await getMergedPeople());

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
