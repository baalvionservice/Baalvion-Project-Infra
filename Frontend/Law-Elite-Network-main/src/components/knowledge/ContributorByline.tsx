"use client";

import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ContributorBioCard } from '@/components/knowledge/ContributorBioCard';

interface ContributorBylineProps {
  /** e.g. "Written by" / "Reviewed by" / "Fact checked by". */
  label: string;
  name: string;
  avatarUrl?: string;
  avatarSeed?: string;
  bio?: string;
  /** Present when the contributor has a real profile page -- required for the name to be clickable. */
  profileSlug?: string;
  /**
   * Repeats "{label} {name}" as a header inside the popover card. Used for
   * Reviewed by / Fact checked by (matches the reference: the popover for
   * "Reviewed by MARGUERITA CHENG" repeats that line above her photo); the
   * primary "Written by" byline omits it since the trigger text already
   * says "Written by" right next to it.
   */
  repeatLabelInCard?: boolean;
  /** Extra verified-only detail lines shown in the popover under the bio (e.g. jurisdiction, bar/license). */
  metaLines?: string[];
}

/**
 * One byline row -- "{label} {Name}", clickable into a bio popover when a
 * real contributor profile is on file. Shared by the "Written by",
 * "Reviewed by", and "Fact checked by" rows in ArticleView.tsx so all three
 * stack as plain lines of matching weight, the pattern this was modeled on
 * (Investopedia's By / Reviewed by / Fact checked by byline block).
 */
export function ContributorByline({ label, name, avatarUrl, avatarSeed, bio, profileSlug, repeatLabelInCard, metaLines }: ContributorBylineProps) {
  const hasProfile = Boolean(profileSlug && bio);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[14px] text-slate-600">
      {label}
      {hasProfile ? (
        <HoverCard openDelay={150} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span
              tabIndex={0}
              className="font-bold text-blue-700 cursor-pointer border-b border-blue-600 hover:text-blue-900 transition-colors leading-none"
            >
              {name}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-[calc(100vw-2rem)] max-w-[400px] p-0 shadow-2xl border-slate-200 rounded-lg bg-white overflow-hidden" align="start" sideOffset={8}>
            <ContributorBioCard
              name={name}
              avatarUrl={avatarUrl}
              avatarSeed={avatarSeed}
              bio={bio}
              profileSlug={profileSlug}
              roleLabel={repeatLabelInCard ? label : undefined}
              metaLines={metaLines}
            />
          </HoverCardContent>
        </HoverCard>
      ) : (
        <span className="font-bold text-slate-900">{name}</span>
      )}
    </div>
  );
}
