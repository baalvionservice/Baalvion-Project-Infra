import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPublicAuthors } from "@/services/data/cms-public";
import { getAllAuthors } from "@/config/authors";
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
  const members: TeamMember[] = live.length
    ? live.slice(0, MAX_SHOWN).map((a) => ({
        slug: a.slug,
        name: a.name,
        title: a.title || "Contributor",
        bio: a.bio || "",
        avatarUrl: a.avatarUrl || undefined,
      }))
    : getAllAuthors()
        .slice(0, MAX_SHOWN)
        .map((a) => ({ slug: a.slug, name: a.name, title: a.title, bio: a.bio, avatarUrl: a.avatarUrl }));

  if (members.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 border-t border-border/60">
      <HomeSectionHeading title="Editorial Team & Reviewers" href="/authors" hrefLabel="Meet the full team" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <Link key={member.slug} href={`/authors/${member.slug}`} className="group flex gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
              <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                {initials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {member.name}
              </h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{member.title}</p>
              {member.bio && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default EditorialTeam;
