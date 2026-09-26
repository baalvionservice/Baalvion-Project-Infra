"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EntitiesResponse, PaginatedArticles, RealArticle } from "@/lib/types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json();
  if (!body.success) throw new Error(body.error?.message ?? "Request failed");
  return body.data as T;
}

function formatExactDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function EntitiesView() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");

  const [entities, setEntities] = useState<EntitiesResponse["items"] | null>(null);
  const [activeEntity, setActiveEntity] = useState<string | null>(initialQuery);
  const [search, setSearch] = useState("");
  const [mentions, setMentions] = useState<RealArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<EntitiesResponse>("/api/news/entities?limit=50&windowHours=168")
      .then((data) => {
        setEntities(data.items);
        if (!activeEntity && data.items.length > 0) setActiveEntity(data.items[0].name);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load entities"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeEntity) return;
    setMentions(null);
    getJson<PaginatedArticles>(`/api/news?entity=${encodeURIComponent(activeEntity)}&limit=20`)
      .then((data) => setMentions(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load mentions"));
  }, [activeEntity]);

  const filteredEntities = useMemo(
    () => (entities ?? []).filter((e) => e.name.toLowerCase().includes(search.toLowerCase())),
    [entities, search]
  );

  const sentimentBreakdown = useMemo(() => {
    if (!mentions || mentions.length === 0) return null;
    const withSentiment = mentions.filter((a) => a.sentiment);
    if (withSentiment.length === 0) return null;
    const positive = withSentiment.filter((a) => a.sentiment === "positive").length;
    return Math.round((positive / withSentiment.length) * 100);
  }, [mentions]);

  const relatedEntities = useMemo(() => {
    if (!mentions || !activeEntity) return [];
    const counts = new Map<string, number>();
    for (const article of mentions) {
      for (const e of article.entities ?? []) {
        if (e.name === activeEntity) continue;
        counts.set(e.name, (counts.get(e.name) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [mentions, activeEntity]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!entities) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading real entities extracted from ingested articles…
      </p>
    );
  }

  if (entities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No entities extracted yet — this fills in automatically once articles are ingested and
        enriched.
      </p>
    );
  }

  const activeCount = entities.find((e) => e.name === activeEntity)?.count ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="glow-card h-fit space-y-3 rounded-xl p-4">
        <Input placeholder="Search entities" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ul className="space-y-1">
          {filteredEntities.map((entity) => (
            <li key={entity.name}>
              <button
                type="button"
                onClick={() => setActiveEntity(entity.name)}
                className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeEntity === entity.name
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex w-full items-center justify-between">
                  <span>{entity.name}</span>
                  <span className="metric text-xs">{entity.count}</span>
                </span>
                <span className="mt-0.5 text-[11px] font-normal text-muted-foreground/70">
                  Last mentioned {formatExactDateTime(entity.lastMentionedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {activeEntity && (
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{activeEntity}</h2>
            <span className="metric text-sm font-semibold text-muted-foreground">
              {activeCount} mentions in the last 7 days
            </span>
          </div>
          {entities.find((e) => e.name === activeEntity) && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last mentioned exactly{" "}
              {formatExactDateTime(entities.find((e) => e.name === activeEntity)!.lastMentionedAt)}
            </p>
          )}

          <Tabs defaultValue="mentions" className="mt-6">
            <TabsList>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>

            <TabsContent value="mentions" className="mt-4 space-y-3">
              {!mentions && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading mentions…
                </p>
              )}
              {mentions?.map((article) => (
                <div key={article.id} className="glow-card rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground">{article.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{article.source.name}</p>
                </div>
              ))}
              {mentions?.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent mentions.</p>
              )}
            </TabsContent>

            <TabsContent value="sentiment" className="mt-4">
              <div className="glow-card rounded-lg p-5">
                {sentimentBreakdown === null ? (
                  <p className="text-sm text-muted-foreground">
                    No sentiment-scored mentions yet for this entity.
                  </p>
                ) : (
                  <>
                    <p className="metric text-3xl font-semibold text-signal-positive">{sentimentBreakdown}%</p>
                    <p className="text-sm text-muted-foreground">
                      positive across mentions with a sentiment score (lexicon-based, see docs)
                    </p>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="related" className="mt-4">
              <div className="flex flex-wrap gap-2">
                {relatedEntities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No co-mentioned entities yet.</p>
                ) : (
                  relatedEntities.map((related) => (
                    <Badge key={related} variant="outline">
                      {related}
                    </Badge>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
