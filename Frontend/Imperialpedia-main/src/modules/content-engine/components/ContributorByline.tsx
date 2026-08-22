"use client";

import React from "react";
import Link from "next/link";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ResolvedAuthor } from "@/services/data/cms-public";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface ContributorBylineProps {
  /** "By" / "Reviewed by" / "Fact checked by". */
  label: string;
  person?: ResolvedAuthor | null;
  /** Small text shown after the name on the same line, e.g. "Updated September 9, 2026". */
  meta?: string;
}

/**
 * One byline row — "{label} {Name}", opening a bio hover-card (Investopedia's
 * By / Reviewed by / Fact checked by pattern, also used on Law Elite Network —
 * see ContributorByline.tsx there) when the person resolves to a real CMS
 * profile with a bio. Renders nothing when no one is on file for this role —
 * never claims a review/fact-check happened when it didn't.
 */
export function ContributorByline({ label, person, meta }: ContributorBylineProps) {
  if (!person) return null;
  const hasProfile = Boolean(person.slug && person.bio);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[13.5px] text-muted-foreground">
      <span>{label}</span>
      {hasProfile ? (
        <HoverCard openDelay={150} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span
              tabIndex={0}
              className="font-bold text-primary cursor-pointer border-b border-primary/40 hover:border-primary transition-colors leading-none"
            >
              {person.name}
            </span>
          </HoverCardTrigger>
          <HoverCardContent
            className="w-[calc(100vw-2rem)] max-w-[380px] p-0 shadow-2xl overflow-hidden"
            align="start"
            sideOffset={8}
          >
            <ContributorBioCard person={person} roleLabel={label} />
          </HoverCardContent>
        </HoverCard>
      ) : (
        <span className="font-bold text-foreground">{person.name}</span>
      )}
      {meta && <span className="text-muted-foreground/70">· {meta}</span>}
    </div>
  );
}

function ContributorBioCard({
  person,
  roleLabel,
}: {
  person: ResolvedAuthor;
  roleLabel: string;
}) {
  return (
    <div className="p-5 space-y-3 bg-popover">
      <p className="text-[12.5px] text-muted-foreground">
        {roleLabel} <span className="font-bold text-foreground">{person.name}</span>
      </p>

      <div className="flex gap-3.5">
        <Avatar className="h-14 w-14 shrink-0 rounded-lg border">
          {/* Grayscale to match the Investopedia reference this pattern is modeled
              on — real photo only, never a fabricated placeholder image. */}
          {person.avatarUrl && (
            <AvatarImage src={person.avatarUrl} alt={person.name} className="grayscale" />
          )}
          <AvatarFallback className="rounded-lg font-bold bg-primary/10 text-primary">
            {initials(person.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-1.5">
          {person.title && <p className="text-[12px] font-semibold text-foreground">{person.title}</p>}
          <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-4">{person.bio}</p>
          <Link
            href={`/authors/${person.slug}`}
            className="inline-block text-[12.5px] font-bold text-primary hover:underline"
          >
            Full bio →
          </Link>
        </div>
      </div>
    </div>
  );
}
