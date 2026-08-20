"use client";

import React from 'react';
import { ContributorByline } from '@/components/knowledge/ContributorByline';
import type { LawAuthor } from '@/data/authors';

interface ArticleAuthorBylineProps {
  authorName: string;
  matchedAuthor: LawAuthor | null;
}

/**
 * "Written by" byline row -- see ContributorByline for the shared popover
 * pattern also used by "Reviewed by" and "Fact checked by" in ArticleView.tsx.
 */
export function ArticleAuthorByline({ authorName, matchedAuthor }: ArticleAuthorBylineProps) {
  return (
    <ContributorByline
      label="Written by"
      name={authorName}
      avatarUrl={matchedAuthor?.avatarUrl}
      avatarSeed={matchedAuthor?.avatarSeed}
      bio={matchedAuthor?.bio}
      profileSlug={matchedAuthor?.slug}
    />
  );
}
