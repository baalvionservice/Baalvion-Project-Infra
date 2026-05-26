import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { getCreatorById } from '@/services/mock-api/creators';
import { CreatorProfileClient } from './CreatorProfileClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

interface CreatorPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Dynamic SEO metadata for creator profiles.
 */
export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await getCreatorById(id);
  const creator = response.data;

  if (!creator) {
    return buildMetadata({ title: 'Expert Not Found', noIndex: true });
  }

  return buildMetadata({
    title: `${creator.displayName} — Financial Intelligence Expert`,
    description: creator.bio,
    ogImage: creator.avatar,
    ogType: 'article', // Using article for personal profile pages can be appropriate or standard website
  });
}

/**
 * Individual Creator Profile Page (Server Component).
 * Routes to /creator/[id]
 */
export default async function CreatorProfilePage({ params }: CreatorPageProps) {
  const { id } = await params;
  const response = await getCreatorById(id);
  const creator = response.data;

  if (!creator) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <Container>
        <CreatorProfileClient creator={creator} />
      </Container>
    </main>
  );
}
