import React from 'react';
import { Container } from '@/design-system/layout/container';
import { DebateRoomClient } from './DebateRoomClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

interface DebatePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DebatePageProps): Promise<Metadata> {
  const { id } = await params;
  return buildMetadata({
    title: `Debate Room ${id} | Community Hub`,
    description: 'Explore active financial debates. Analyze Bull vs Bear arguments and participate in the community consensus.',
  });
}

/**
 * Individual Debate Room Page (Server Entry).
 */
export default async function DebateRoomPage({ params }: DebatePageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <DebateRoomClient id={id} />
      </Container>
    </main>
  );
}
