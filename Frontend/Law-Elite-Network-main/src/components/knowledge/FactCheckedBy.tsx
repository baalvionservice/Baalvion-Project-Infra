"use client";

import React from 'react';
import { ContributorByline } from '@/components/knowledge/ContributorByline';

export interface FactCheckedByInfo {
  name: string;
  checkDate: string;
  /** Present when the fact-checker resolves to a real contributor profile -- required for the bio popover. */
  slug?: string;
  bio?: string;
  avatarUrl?: string;
  avatarSeed?: string;
}

/**
 * "Fact checked by" byline row -- same pattern as ReviewedBy.tsx, next to it
 * in the byline stack. Renders nothing when no fact-checker is on file for
 * this article; never claims a check happened when it didn't.
 */
export function FactCheckedBy({ info }: { info?: FactCheckedByInfo }) {
  if (!info) return null;

  return (
    <ContributorByline
      label="Fact checked by"
      name={info.name}
      avatarUrl={info.avatarUrl}
      avatarSeed={info.avatarSeed}
      bio={info.bio}
      profileSlug={info.slug}
      repeatLabelInCard
      metaLines={[`Checked: ${info.checkDate}`]}
    />
  );
}
