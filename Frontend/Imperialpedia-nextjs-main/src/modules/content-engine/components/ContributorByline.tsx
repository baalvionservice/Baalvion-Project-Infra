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
 * Interactive Byline row ("By {Name}", "Reviewed by {Name}", "Fact checked by {Name}").
 * Displays a rich bio card popover when touched or hovered.
 */
export function ContributorByline({ label, person, meta }: ContributorBylineProps) {
  if (!person) return null;
  const hasProfile = Boolean(person.slug && (person.bio || person.title));

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#555555] dark:text-gray-400">
      <span className="text-[#666666]">{label}</span>
      {hasProfile ? (
        <HoverCard openDelay={100} closeDelay={150}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="font-bold uppercase tracking-wider text-[#121212] dark:text-white hover:text-[#1d4fc4] dark:hover:text-blue-400 border-b border-dashed border-gray-400/80 hover:border-solid hover:border-[#1d4fc4] transition-all cursor-pointer text-left inline-block"
            >
              {person.name}
            </button>
          </HoverCardTrigger>
          <HoverCardContent
            className="w-[calc(100vw-2rem)] max-w-[390px] p-0 shadow-2xl overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818] z-50"
            align="start"
            sideOffset={8}
          >
            <ContributorBioCard person={person} roleLabel={label} />
          </HoverCardContent>
        </HoverCard>
      ) : (
        <span className="font-bold uppercase tracking-wider text-[#121212] dark:text-white">
          {person.name}
        </span>
      )}
      {meta && <span className="text-[#777777] text-[11px] ml-1">{meta}</span>}
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
    <div className="p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {roleLabel}
        </span>
        {person.credentials && (
          <span className="text-[10.5px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
            Verified
          </span>
        )}
      </div>

      <div className="flex gap-4 items-start">
        <Avatar className="h-14 w-14 shrink-0 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          {person.avatarUrl && (
            <AvatarImage src={person.avatarUrl} alt={person.name} className="object-cover" />
          )}
          <AvatarFallback className="rounded-full font-bold bg-[#1d4fc4]/10 text-[#1d4fc4] text-sm">
            {initials(person.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-1">
          <h4 className="text-[15px] font-bold text-gray-900 dark:text-white leading-snug">
            {person.name}
          </h4>
          {person.title && (
            <p className="text-[12px] font-semibold text-[#1d4fc4] dark:text-blue-400">
              {person.title}
            </p>
          )}
          {person.credentials && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
              {person.credentials}
            </p>
          )}
        </div>
      </div>

      {person.bio && (
        <p className="text-[12.5px] leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3">
          {person.bio}
        </p>
      )}

      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <Link
          href={`/authors/${person.slug}`}
          className="inline-flex items-center text-[12px] font-bold text-[#1d4fc4] dark:text-blue-400 hover:underline"
        >
          View Full Editorial Bio →
        </Link>
      </div>
    </div>
  );
}
