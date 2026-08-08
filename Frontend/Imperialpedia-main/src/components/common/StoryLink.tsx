import Link from "next/link";
import type { ReactNode } from "react";
import { storyHref, type LinkableStory } from "@/lib/data/article-url";

/**
 * Wraps World/CNBC-style news tiles in the correct clickable element:
 * an internal <Link> for owned CMS articles (slug present), an external
 * <a target="_blank"> for wire content with no owned page (href present),
 * or a plain non-interactive wrapper when neither is available (the static
 * demo fallback, shown only if every live news source is down).
 */
export function StoryLink({
  item,
  className,
  as: Wrapper = "div",
  children,
}: {
  item: LinkableStory;
  className?: string;
  as?: "div" | "li";
  children: ReactNode;
}) {
  const dest = storyHref(item);
  if (!dest) {
    const Tag = Wrapper;
    return <Tag className={className}>{children}</Tag>;
  }
  if (dest.external) {
    return (
      <a href={dest.href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={dest.href} className={className}>
      {children}
    </Link>
  );
}
