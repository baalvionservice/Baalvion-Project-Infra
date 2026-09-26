import React from "react";
import Link from "next/link";
import { Text } from "@/design-system/typography/text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPublicAuthors } from "@/services/data/cms-public";
import { getAllAuthors } from "@/config/authors";
import { isAuthorHiddenInCleanupMode } from "@/config/adsense-cleanup";

// Full masthead (all ~34 contributors, every credential) lives at /authors —
// this section exists so a reviewer landing on /about specifically (rather
// than following a link) sees the same real credentials without a click,
// per Google's guidance to make author expertise checkable from the About
// page itself. Capped rather than duplicating the whole roster here.
const MAX_SHOWN = 9;

const initials = (name: string) =>
  name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

interface TeamMember {
  slug: string;
  name: string;
  title: string;
  credentials?: string;
  education?: string[];
  certifications?: string[];
  avatarUrl?: string;
}

export async function AboutEditorialTeam() {
  const live = await getPublicAuthors();
  const rawMembers: TeamMember[] = live.length
    ? live.map((a) => ({
        slug: a.slug,
        name: a.name,
        title: a.title || "Contributor",
        credentials: a.credentials || undefined,
        education: a.education?.length ? a.education : undefined,
        certifications: a.certifications?.length ? a.certifications : undefined,
        avatarUrl: a.avatarUrl || undefined,
      }))
    : getAllAuthors().map((a) => ({ slug: a.slug, name: a.name, title: a.title, avatarUrl: a.avatarUrl }));

  const members = rawMembers.filter((m) => !isAuthorHiddenInCleanupMode(m.slug)).slice(0, MAX_SHOWN);

  if (members.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Text variant="h3" className="text-xl font-bold">
          Editorial team
        </Text>
        <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-3xl">
          Every article is written or reviewed by a named contributor. Most hold a professional
          financial certification, a relevant degree, or both — shown below exactly as recorded on
          their profile.
        </Text>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Link
            key={member.slug}
            href={`/authors/${member.slug}`}
            className="group space-y-3 rounded-2xl border border-white/10 bg-card/40 p-5 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 shrink-0">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                <AvatarFallback className="text-sm font-bold">{initials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Text variant="bodySmall" className="font-bold truncate group-hover:text-primary transition-colors">
                  {member.name}
                </Text>
                <Text variant="caption" className="text-muted-foreground truncate block">
                  {member.title}
                </Text>
              </div>
            </div>

            {member.credentials && (
              <Text variant="caption" className="block font-semibold text-foreground/80">
                {member.credentials}
              </Text>
            )}
            {member.education?.length ? (
              <Text variant="caption" className="block text-muted-foreground">
                <span className="font-semibold text-foreground/70">Education: </span>
                {member.education.join(" · ")}
              </Text>
            ) : null}
            {member.certifications?.length ? (
              <Text variant="caption" className="block text-muted-foreground">
                <span className="font-semibold text-foreground/70">Certifications: </span>
                {member.certifications.join(" · ")}
              </Text>
            ) : null}
          </Link>
        ))}
      </div>

      <Link
        href="/authors"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        See the full editorial masthead →
      </Link>
    </div>
  );
}
