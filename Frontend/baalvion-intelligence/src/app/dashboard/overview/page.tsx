import { AlertTriangle, Database, Gauge, Radio } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchNewsService } from "@/lib/news-api.server";
import type { StatsOverview, TrendingResponse } from "@/lib/types";

export default async function OverviewPage() {
  const [stats, trending] = await Promise.all([
    fetchNewsService("/v1/stats/overview") as Promise<StatsOverview>,
    fetchNewsService("/v1/news/trending", new URLSearchParams({ dimension: "category" })) as Promise<TrendingResponse>,
  ]);

  return (
    <div className="space-y-5">
      {stats.totalArticles === 0 && (
        <Card className="border-signal-neutral/40 bg-secondary/30">
          <CardContent className="flex items-start gap-3 pt-6 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-neutral" aria-hidden />
            <p>
              0 articles is expected here: this environment has no outbound network access, so the
              ingestion pipeline below cannot reach real RSS feeds. Everything on this page is live
              data from the real database and API — run <code className="font-mono">pnpm --filter news-service dev</code>{" "}
              on a machine with internet access and articles will appear automatically.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="glow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <h2 className="text-base font-semibold text-foreground">Total articles</h2>
            <Database className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="metric text-3xl font-semibold text-foreground">{stats.totalArticles.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stats.articlesLast24h} ingested in the last 24h</p>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <h2 className="text-base font-semibold text-foreground">Sources</h2>
            <Radio className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="metric text-3xl font-semibold text-foreground">
              {stats.activeSources}
              <span className="text-base font-normal text-muted-foreground"> / {stats.totalSources} active</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">RSS/government feeds registered</p>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <h2 className="text-base font-semibold text-foreground">Last ingestion</h2>
            <Gauge className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">
              {stats.lastIngestedAt ? new Date(stats.lastIngestedAt).toLocaleString() : "Never"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Most recent article pulled into the database</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glow-card">
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Volume by category (last 24h vs. prior 24h)</h2>
        </CardHeader>
        <CardContent>
          {trending.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No article volume yet.</p>
          ) : (
            <ol className="space-y-1">
              {trending.items.map((item, index) => (
                <li key={item.value} className="flex items-center justify-between rounded-md px-2 py-2.5 hover:bg-secondary/40">
                  <span className="flex items-center gap-3">
                    <span className="metric w-5 text-sm text-muted-foreground">{index + 1}</span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{item.count} articles</Badge>
                    {item.changePct !== null && (
                      <span className={`metric text-sm font-semibold ${item.changePct >= 0 ? "text-signal-positive" : "text-signal-negative"}`}>
                        {item.changePct >= 0 ? "+" : ""}
                        {item.changePct}%
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
