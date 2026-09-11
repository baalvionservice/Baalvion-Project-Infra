import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPublicAuthors } from "@/services/data/cms-public";
import { getAllAuthors } from "@/config/authors";
import { isAuthorHiddenInCleanupMode } from "@/config/adsense-cleanup";
import { HomeSectionHeading } from "./HomeSectionHeading";

const MAX_SHOWN = 6;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface TeamMember {
  slug: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
}

/**
 * "Editorial Team & Reviewers" — surfaces the same real, CMS-backed roster
 * that powers /authors (falling back to the static config/authors.ts trio
 * when the CMS has none), rather than inventing bylines. Leadership ≠
 * editorial expertise, so this is deliberately a separate section from
 * Leadership.tsx — it exists to show who actually writes, reviews, and
 * fact-checks the content, with role and relevant background.
 */
export async function EditorialTeam() {
  const live = await getPublicAuthors();
  const rawMembers: TeamMember[] = live.length
    ? live.map((a) => ({
        slug: a.slug,
        name: a.name,
        title: a.title || "Contributor",
        bio: a.bio || "",
        avatarUrl: a.avatarUrl || undefined,
      }))
    : getAllAuthors()
        .map((a) => ({ slug: a.slug, name: a.name, title: a.title, bio: a.bio, avatarUrl: a.avatarUrl }));

  const members = rawMembers.filter((m) => !isAuthorHiddenInCleanupMode(m.slug)).slice(0, MAX_SHOWN);

  if (members.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <HomeSectionHeading title="EDITORIAL TEAM &amp; REVIEWERS // MASTHEAD" href="/authors" hrefLabel="MEET THE FULL TEAM →" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <Link 
            key={member.slug} 
            href={`/authors/${member.slug}`} 
            className="group flex gap-4 bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(200,16,46,1)] transition-all rounded-xs"
          >
            <Avatar className="h-14 w-14 shrink-0 border-2 border-black dark:border-slate-700 shadow-sm rounded-none">
              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
              <AvatarFallback className="text-sm font-black font-serif bg-[#c8102e] text-white rounded-none">
                {initials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-sm font-black uppercase font-serif text-black dark:text-white group-hover:text-[#c8102e] transition-colors">
                {member.name}
              </h3>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c8102e]">{member.title}</p>
              {member.bio && (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{member.bio}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
