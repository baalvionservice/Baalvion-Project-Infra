import React from "react";
import Link from "next/link";
import { getCategoryDirectory, type CategoryDirectoryEntry } from "@/services/data/cms-public";
import { HomeSectionHeading } from "./HomeSectionHeading";

/**
 * "Browse All Topics" — the site's full, real category breadth (50+
 * categories) as a single directory, independent of whatever the
 * algorithmically-curated Lead/Topic Sections/Latest Articles rails above
 * happened to pick. Those rails are necessarily selective; this section
 * exists so a category that isn't currently getting a dedicated row (most
 * of them, by design — see getHomeEditorial.ts) is still one click away
 * from the homepage instead of effectively invisible.
 *
 * Rendered as an A–Z index (CSS multi-column, letter-grouped) rather than a
 * flat wall of 50+ same-weight pills — a directory of this size reads as
 * organized reference material this way, not a wall of buttons.
 */
export async function AllCategories() {
  const directory = await getCategoryDirectory();
  if (directory.length === 0) return null;

  const groups = groupAlphabetically(directory);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Browse All Topics" />
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-x-8">
        {groups.map(([letter, entries]) => (
          <div key={letter} className="mb-6 break-inside-avoid">
            <h3 className="mb-2 text-xs font-black text-primary">{letter}</h3>
            <ul className="space-y-1.5">
              {entries.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`/${entry.slug}`}
                    className="group inline-flex items-baseline gap-1.5 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span className="group-hover:underline underline-offset-2">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">{entry.articleCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function groupAlphabetically(directory: CategoryDirectoryEntry[]): [string, CategoryDirectoryEntry[]][] {
  const sorted = [...directory].sort((a, b) => a.name.localeCompare(b.name));
  const byLetter = new Map<string, CategoryDirectoryEntry[]>();
  for (const entry of sorted) {
    const letter = entry.name.charAt(0).toUpperCase();
    const bucket = byLetter.get(letter);
    if (bucket) bucket.push(entry);
    else byLetter.set(letter, [entry]);
  }
  return [...byLetter.entries()];
}

export default AllCategories;
