"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuthedFetch } from "@/lib/auth/use-authed-fetch";
import { dailyLimitFromScopes, planLabelFromScopes } from "@/lib/plan-quota";
import type { UsageReport } from "@/lib/types";

import { UsageChart } from "./usage-chart";

export function UsageView() {
  const authedFetch = useAuthedFetch();
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch<UsageReport>("/api/usage")
      .then(setUsage)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load usage"));
  }, [authedFetch]);

  if (error) {
    return (
      <Card className="glow-card">
        <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card className="glow-card">
        <CardContent className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading real usage from your account&apos;s API keys…
        </CardContent>
      </Card>
    );
  }

  const primaryKey = usage.keys[0];
  const dailyLimit = primaryKey ? dailyLimitFromScopes(primaryKey.scopes) : null;
  const planName = primaryKey ? planLabelFromScopes(primaryKey.scopes) : "Free";

  return (
    <div className="space-y-5">
      {!usage.redisAvailable && (
        <Card className="border-signal-neutral/40 bg-secondary/30">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Redis is unavailable right now, so usage counts can&apos;t be read — this isn&apos;t a
            zero-usage account, the counters just aren&apos;t reachable this moment.
          </CardContent>
        </Card>
      )}
      <Card className="glow-card">
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Requests this month</h2>
          <p className="text-sm text-muted-foreground">
            {usage.totalMonthToDate.toLocaleString()} requests across {usage.keys.length}{" "}
            {usage.keys.length === 1 ? "key" : "keys"} &middot; {planName} plan
            {dailyLimit ? ` · ${dailyLimit.toLocaleString()} requests/day cap` : ""} &middot; {usage.month}
          </p>
        </CardHeader>
        <CardContent>
          <UsageChart data={usage.dailySeries} />
        </CardContent>
      </Card>

      {usage.keys.length > 0 && (
        <Card className="glow-card">
          <CardHeader>
            <h2 className="text-base font-semibold text-foreground">By key</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {usage.keys.map((key) => (
              <div key={key.keyId} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {key.name} <span className="font-mono text-muted-foreground">···{key.last4}</span>
                </span>
                <span className="metric text-muted-foreground">
                  {key.usedToday.toLocaleString()} today &middot; {key.monthToDate.toLocaleString()} this month
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
