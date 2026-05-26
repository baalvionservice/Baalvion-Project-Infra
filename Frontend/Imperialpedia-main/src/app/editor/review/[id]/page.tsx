import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { ReviewConsole } from './ReviewConsole';
import { getEditorialDashboardData } from '@/services/mock-api/editorial';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { id } = await params;
  return buildMetadata({
    title: `Review Console: ${id} | Editorial Hub`,
    description: 'Specialized interface for validating expert submissions and enforcing platform-wide factual integrity.',
  });
}

/**
 * Editorial Review Console Page (Server Entry).
 * Orchestrates the discovery of submission metadata and hands off to the interactive auditor suite.
 */
export default async function EditorialReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const response = await getEditorialDashboardData();
  const submission = response.data.submissions.find(s => s.id === id);

  if (!submission) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <ReviewConsole submission={submission} />
      </Container>
    </main>
  );
}
