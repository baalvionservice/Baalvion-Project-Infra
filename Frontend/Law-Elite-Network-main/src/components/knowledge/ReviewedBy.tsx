"use client";

import React from 'react';
import { ContributorByline } from '@/components/knowledge/ContributorByline';

export interface ReviewedByInfo {
  name: string;
  jurisdiction?: string;
  barLicense?: string;
  reviewDate: string;
  /**
   * Present when the reviewer resolves to a real contributor profile (see
   * `resolveReviewedBy` in ArticleView.tsx) -- required for the bio popover.
   * A reviewer credited by name only, with no matching profile, still
   * renders correctly; it just isn't clickable, since there's no bio/photo
   * to show and no fabricated one is used.
   */
  slug?: string;
  bio?: string;
  avatarUrl?: string;
  avatarSeed?: string;
}

/**
 * "Reviewed by" byline row -- renders nothing when no reviewer is on file
 * for this article (never claims review happened when it didn't). The
 * disclosure that a guide is *not* independently attorney-reviewed still
 * lives in EditorialInformation.tsx further down the page; this row, next
 * to "Written by", stays quiet until a real reviewer is actually named --
 * matching the reference's plain stacked-line pattern rather than a boxed
 * callout up top.
 */
export function ReviewedBy({ info }: { info?: ReviewedByInfo }) {
  if (!info) return null;

  // Only shown when real, verifiable values are on file -- never inferred
  // or defaulted, per the no-fabrication rule on these fields.
  const metaLines = [
    info.jurisdiction ? `Jurisdiction: ${info.jurisdiction}` : null,
    info.barLicense ? `Professional status: ${info.barLicense}` : null,
    `Reviewed: ${info.reviewDate}`,
  ].filter((line): line is string => Boolean(line));

  return (
    <ContributorByline
      label="Reviewed by"
      name={info.name}
      avatarUrl={info.avatarUrl}
      avatarSeed={info.avatarSeed}
      bio={info.bio}
      profileSlug={info.slug}
      repeatLabelInCard
      metaLines={metaLines}
    />
  );
}
