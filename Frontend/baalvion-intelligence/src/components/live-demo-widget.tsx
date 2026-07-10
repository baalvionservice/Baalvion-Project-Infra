"use client";

import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { entitySnapshots } from "@/lib/mock-data";

const queries = Object.keys(entitySnapshots);

export function LiveDemoWidget() {
  const [activeQuery, setActiveQuery] = useState(queries[0]);
  const snapshot = entitySnapshots[activeQuery];

  return (
    <div className="glow-card relative overflow-hidden rounded-xl p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-5">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" aria-hidden />
          <span className="font-mono">Search:</span>
        </div>
        {queries.map((query) => (
          <button
            key={query}
            type="button"
            onClick={() => setActiveQuery(query)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              activeQuery === query
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={activeQuery === query}
          >
            {query}
          </button>
        ))}
      </div>

      <div className="grid gap-8 pt-6 md:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="font-display text-2xl font-semibold">{snapshot.name}</h3>
            <span className="metric flex items-center gap-1 text-sm font-semibold text-signal-positive">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
              {snapshot.mentionsChangePct}% mentions today
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Mentions</dt>
              <dd className="metric mt-1 text-2xl font-semibold text-foreground">
                {snapshot.mentions.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sentiment</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span className="metric text-2xl font-semibold text-signal-positive">
                  {snapshot.sentimentPositivePct}%
                </span>
                <span className="text-xs text-muted-foreground">positive</span>
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Top topics</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {snapshot.topTopics.map((topic) => (
                <li key={topic}>
                  <Badge variant="secondary">{topic}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/60 p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Latest AI summary</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{snapshot.summary}</p>
          <p className="mt-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">Sources</p>
          <p className="mt-2 text-sm text-muted-foreground">Reuters &middot; Bloomberg &middot; CNBC &middot; BBC</p>
        </div>
      </div>
    </div>
  );
}
