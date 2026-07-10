"use client";

import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TrendingItem } from "@/lib/types";

const dimensions: Array<{ value: "category" | "country" | "source"; label: string }> = [
  { value: "category", label: "By Category" },
  { value: "country", label: "By Country" },
  { value: "source", label: "By Source" },
];

function DimensionPanel({ dimension }: { dimension: "category" | "country" | "source" }) {
  const [items, setItems] = useState<TrendingItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/news/trending?dimension=${dimension}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body.success) setItems(body.data.items);
      });
    return () => {
      cancelled = true;
    };
  }, [dimension]);

  if (items === null) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="glow-card rounded-xl p-6">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No article volume yet to rank — this fills in once real articles are ingested.
        </p>
      ) : (
        <ol className="space-y-1">
          {items.map((item, index) => (
            <li key={item.value} className="flex items-center justify-between rounded-md px-2 py-2.5 hover:bg-secondary/40">
              <span className="flex items-center gap-3">
                <span className="metric w-5 text-sm text-muted-foreground">{index + 1}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </span>
              <span className="metric text-sm font-semibold text-foreground">{item.count} articles</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function TrendsView() {
  return (
    <Tabs defaultValue="category">
      <TabsList>
        {dimensions.map((dim) => (
          <TabsTrigger key={dim.value} value={dim.value}>
            {dim.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {dimensions.map((dim) => (
        <TabsContent key={dim.value} value={dim.value} className="mt-6">
          <DimensionPanel dimension={dim.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
