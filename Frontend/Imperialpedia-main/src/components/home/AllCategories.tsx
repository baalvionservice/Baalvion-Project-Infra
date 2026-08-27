import React from "react";
import { getCategoryDirectory, type CategoryDirectoryEntry } from "@/services/data/cms-public";
import { AllCategoriesDialog } from "./AllCategoriesDialog";

/**
 * "Browse All Topics" — the site's full, real category breadth (50+
 * categories), independent of whatever the algorithmically-curated
 * Lead/Topic Sections/Latest Articles rails above happened to pick. Those
 * rails are necessarily selective; this exists so a category that isn't
 * currently getting a dedicated row (most of them, by design — see
 * getHomeEditorial.ts) is still reachable from the homepage instead of
 * effectively invisible.
 *
 * Rendered as a compact click-to-open box (AllCategoriesDialog) rather than
 * an always-expanded A-Z index — a directory this size cost every visitor a
 * full section of scroll whether or not they wanted it; the full index is
 * unchanged, just one click away instead of always open.
 */
export async function AllCategories() {
  const directory = await getCategoryDirectory();
  if (directory.length === 0) return null;

  const groups = groupAlphabetically(directory);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 border-t border-border">
      <AllCategoriesDialog groups={groups} totalCount={directory.length} />
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
