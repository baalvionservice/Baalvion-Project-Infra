import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { getCreatorById, getCreatorContent } from '@/services/mock-api/creators';
import { CreatorContentClient } from './CreatorContentClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

interface CreatorContentPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Dynamic SEO metadata for creator content archives.
 */
export async function generateMetadata({ params }: CreatorContentPageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await getCreatorById(id);
  const creator = response.data;

  if (!creator) {
    return buildMetadata({ title: 'Expert Archive Not Found', noIndex: true });
  }

  return buildMetadata({
    title: `${creator.displayName} Intelligence Archive`,
    description: `Browse all expert financial analysis and intelligence reports published by ${creator.displayName} on the Imperialpedia Index.`,
  });
}

/**
 * Creator Content Archive Page (Server Entry).
 * Fetches initial content array and hands off to interactive client for pagination.
 */
export default async function CreatorContentArchivePage({ params }: CreatorContentPageProps) {
  const { id } = await params;
  const [creatorRes, contentRes] = await Promise.all([
    getCreatorById(id),
    getCreatorContent(id)
  ]);

  const creator = creatorRes.data;
  const content = contentRes.data;

  if (!creator) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <Container>
        <CreatorContentClient creator={creator} initialContent={content} />
      </Container>
    </main>
  );
}
