import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { getCreatorById, getFollowers, getFollowing } from '@/services/mock-api/creators';
import { FollowersClient } from './FollowersClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

interface FollowersPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Dynamic SEO metadata for creator network pages.
 */
export async function generateMetadata({ params }: FollowersPageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await getCreatorById(id);
  const creator = response.data;

  if (!creator) {
    return buildMetadata({ title: 'Expert Network Not Found', noIndex: true });
  }

  return buildMetadata({
    title: `${creator.displayName}'s Network | Expert Intelligence Index`,
    description: `Explore the professional network of ${creator.displayName}. See who follows their financial research and who they trust for market analysis.`,
  });
}

/**
 * Creator Network Page (Server Entry).
 * Fetches initial social graphs and hands off to interactive client for management.
 */
export default async function CreatorNetworkPage({ params }: FollowersPageProps) {
  const { id } = await params;
  const [creatorRes, followersRes, followingRes] = await Promise.all([
    getCreatorById(id),
    getFollowers(id),
    getFollowing(id)
  ]);

  const creator = creatorRes.data;
  const followers = followersRes.data;
  const following = followingRes.data;

  if (!creator) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <Container>
        <FollowersClient 
          creator={creator} 
          initialFollowers={followers} 
          initialFollowing={following} 
        />
      </Container>
    </main>
  );
}
