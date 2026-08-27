"use client";

import React from "react";
import Link from "next/link";
import { LayoutGrid, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CategoryDirectoryEntry } from "@/services/data/cms-public";

type Props = {
  groups: [string, CategoryDirectoryEntry[]][];
  totalCount: number;
};

/**
 * "Browse All Topics" as a compact click-to-open box instead of an always-
 * expanded 50+ category A-Z directory taking up a full page section — the
 * full index is real, useful reference material, but every visitor paying
 * that scroll cost up front (even the ones who never use it) was the actual
 * complaint. The directory content itself is unchanged, just moved behind
 * one click into a dialog.
 */
export function AllCategoriesDialog({ groups, totalCount }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-4 rounded-md border border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-bold text-foreground">Browse All Topics</span>
              <span className="block text-xs text-muted-foreground">
                {totalCount} categories, A&ndash;Z
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Browse All Topics</DialogTitle>
        </DialogHeader>
        <div className="columns-2 sm:columns-3 gap-x-8">
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
      </DialogContent>
    </Dialog>
  );
}

export default AllCategoriesDialog;
