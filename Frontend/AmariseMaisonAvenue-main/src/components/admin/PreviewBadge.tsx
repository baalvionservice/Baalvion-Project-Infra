"use client";

import React from "react";
import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * PreviewBadge — an explicit, clearly-labeled marker for admin surfaces that still
 * render simulated ("preview") data because they have NO backing API yet.
 *
 * Honesty rule: any dashboard NOT wired to a live endpoint must show this so the
 * numbers are never mistaken for production data. Two variants:
 *   - <PreviewBadge />        → compact inline pill (drop next to a page title)
 *   - <PreviewNotice />       → a full-width banner for the top of a mock page
 */
export function PreviewBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-none border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.3em] text-amber-500",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" />
      Preview data
    </Badge>
  );
}

export function PreviewNotice({
  className,
  message = "This surface shows simulated preview data — it is not yet wired to a live backend.",
}: {
  className?: string;
  message?: string;
}) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-center gap-3 border border-amber-500/30 bg-amber-500/5 px-5 py-3",
        className,
      )}
    >
      <FlaskConical className="h-4 w-4 shrink-0 text-amber-500" />
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-500/90">
        {message}
      </span>
    </div>
  );
}
