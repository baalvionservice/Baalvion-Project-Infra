import { Suspense, type SVGProps } from "react";
import Link from "next/link";
import { Twitter, Linkedin, Instagram } from "lucide-react";
import { TrendingNowModule, MoreInCategoryModule } from "@/components/article/ArticleSidebarModules";
import { FollowedTopicsRail } from "@/components/article/FollowedTopicsRail";
import { LabeledAdSlot } from "@/components/common/LabeledAdSlot";
import { getTopicColor } from "@/lib/topic-colors";

// Lucide has no Discord glyph (not a generic icon, a brand logo) — inline path,
// same approach as ShareBar's Reddit icon.
function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.6 3a14 14 0 0 0-.6 1.3 18.3 18.3 0 0 0-5.5 0A14 14 0 0 0 8.9 3a19.7 19.7 0 0 0-4.7 1.5C1.6 8.3 1 12 1.2 15.7A20 20 0 0 0 7.2 18c.5-.7.9-1.4 1.2-2.2a13 13 0 0 1-1.9-.9l.5-.4a14.2 14.2 0 0 0 12 0l.5.4c-.6.4-1.2.6-1.9.9.3.8.7 1.5 1.2 2.2a20 20 0 0 0 6-2.3c.3-4.3-.5-8-2.5-11.3zM8.8 13.5c-.8 0-1.5-.8-1.5-1.7 0-1 .6-1.7 1.5-1.7s1.5.8 1.5 1.7c0 1-.7 1.7-1.5 1.7zm6.4 0c-.8 0-1.5-.8-1.5-1.7 0-1 .6-1.7 1.5-1.7s1.5.8 1.5 1.7c0 1-.6 1.7-1.5 1.7z" />
    </svg>
  );
}

function RedditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

const COMMUNITY_LINKS = [
  { label: "Follow on X", href: "https://twitter.com/imperialpedia", icon: Twitter },
  { label: "Follow on LinkedIn", href: "https://linkedin.com/company/imperialpedia", icon: Linkedin },
  { label: "Join Our Discord Channel", href: "https://discord.gg/nmc3QnwxW", icon: DiscordIcon },
  { label: "Follow on Instagram", href: "https://www.instagram.com/allen.techfounder/", icon: Instagram },
  { label: "Join Reddit", href: "https://www.reddit.com/user/imperialpedia/", icon: RedditIcon },
];

export function ArticleSidebar({
  categorySlug,
  categoryLabel,
  excludeSlug,
}: {
  categorySlug?: string;
  categoryLabel: string;
  excludeSlug: string;
}) {
  const color = getTopicColor(categoryLabel);

  return (
    <aside className="min-w-0 space-y-8 pt-[210px] lg:pt-[230px] xl:pt-[250px] -mr-4 xl:-mr-10">
      <div className="rounded-lg border border-border border-t-4 p-5" style={{ borderTopColor: color }}>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color }}>
          Community
        </h2>
        <ul className="space-y-2.5">
          {COMMUNITY_LINKS.map(({ label, href, icon: Icon }) =>
            href === "#" ? (
              <li key={label} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground/50">
                <Icon className="h-4 w-4" />
                {label}
                <span className="text-[10px] font-bold uppercase tracking-wide">(soon)</span>
              </li>
            ) : (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-70"
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                  {label}
                </a>
              </li>
            ),
          )}
        </ul>
      </div>

      <FollowedTopicsRail excludeSlug={excludeSlug} />

      <Suspense fallback={null}>
        <MoreInCategoryModule categorySlug={categorySlug} categoryLabel={categoryLabel} excludeSlug={excludeSlug} />
      </Suspense>

      <Suspense fallback={null}>
        <TrendingNowModule color={color} />
      </Suspense>

      <LabeledAdSlot slot="8362925887" />

      <div className="rounded-lg border border-border p-5">
        <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-foreground">Have a tip?</h2>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Spotted an error, or have a story we should be covering? We want to hear from you.
        </p>
        <Link href="/contact" className="text-xs font-bold text-primary hover:underline">
          Get in touch →
        </Link>
      </div>
    </aside>
  );
}
