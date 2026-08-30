import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SiblingTopic } from "@/lib/topic-config";

interface SubtopicTabsProps {
  current: string;
  siblings: SiblingTopic[];
}

/**
 * Horizontal, scrollable tab strip linking to sibling sub-topics (e.g. Stocks / Bonds /
 * ETFs / Options / Commodities on the Investing pages). Renders on every sub-topic page
 * via CategoryFeed so readers can pivot between related topics without a full round trip
 * back to the parent hub — the "unified category view" from a set of otherwise-isolated
 * single-topic pages, without merging their separate, individually-indexable routes.
 */
export function SubtopicTabs({ current, siblings }: SubtopicTabsProps) {
  return (
    <nav
      aria-label="Related topics"
      className="border-b border-gray-100 -mx-4 px-4 sm:mx-0 sm:px-0"
    >
      <div className="relative">
        <div className="flex gap-1 overflow-x-auto scrollbar-none [mask-image:linear-gradient(to_right,white_85%,transparent_100%)]">
          {siblings.map((s) => {
            const isCurrent = s.slug === current;
            return (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
                  isCurrent
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                )}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
