"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { articles, entitySnapshots } from "@/lib/mock-data";

const entityNames = Object.keys(entitySnapshots);

export function EntitiesView() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [activeEntity, setActiveEntity] = useState(
    initialQuery && entityNames.includes(initialQuery) ? initialQuery : entityNames[0]
  );
  const [search, setSearch] = useState("");

  const filteredNames = useMemo(
    () => entityNames.filter((name) => name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const snapshot = entitySnapshots[activeEntity];
  const mentioningArticles = useMemo(
    () => articles.filter((article) => article.entities.includes(activeEntity)),
    [activeEntity]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="glow-card h-fit space-y-3 rounded-xl p-4">
        <Input placeholder="Search entities" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ul className="space-y-1">
          {filteredNames.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => setActiveEntity(name)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeEntity === name ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div>
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-semibold text-foreground">{snapshot.name}</h2>
          <span className="metric text-sm font-semibold text-signal-positive">
            +{snapshot.mentionsChangePct}% mentions
          </span>
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">{snapshot.summary}</p>
            <div className="flex flex-wrap gap-2">
              {snapshot.topTopics.map((topic) => (
                <Badge key={topic} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mentions" className="mt-4 space-y-3">
            {mentioningArticles.map((article) => (
              <div key={article.id} className="glow-card rounded-lg p-4">
                <p className="text-sm font-medium text-foreground">{article.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{article.source}</p>
              </div>
            ))}
            {mentioningArticles.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent mentions in the sample dataset.</p>
            )}
          </TabsContent>

          <TabsContent value="sentiment" className="mt-4">
            <div className="glow-card rounded-lg p-5">
              <p className="metric text-3xl font-semibold text-signal-positive">
                {snapshot.sentimentPositivePct}%
              </p>
              <p className="text-sm text-muted-foreground">positive across today&apos;s coverage</p>
            </div>
          </TabsContent>

          <TabsContent value="related" className="mt-4">
            <div className="flex flex-wrap gap-2">
              {snapshot.relatedEntities.map((related) => (
                <Badge key={related} variant="outline">
                  {related}
                </Badge>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
