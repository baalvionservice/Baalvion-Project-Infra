"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usageSummary } from "@/lib/mock-data";

function generateMockKey(): string {
  return `bvi_demo_${Math.random().toString(36).slice(2, 34)}`;
}

function mask(key: string): string {
  return `${key.slice(0, 12)}${"•".repeat(key.length - 16)}${key.slice(-4)}`;
}

export function ApiKeysView() {
  const [key, setKey] = useState(() => generateMockKey());
  const [revealed, setRevealed] = useState(false);
  const [revoked, setRevoked] = useState(false);

  function regenerate() {
    setKey(generateMockKey());
    setRevoked(false);
    setRevealed(false);
  }

  const usagePct = Math.round((usageSummary.requestsUsed / usageSummary.requestsLimit) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="glow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <h2 className="text-base font-semibold text-foreground">API key</h2>
          <Badge variant={revoked ? "negative" : "positive"}>{revoked ? "Revoked" : "Active"}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <code className="flex-1 truncate font-mono text-sm text-foreground/90">
              {revealed ? key : mask(key)}
            </code>
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={revealed ? "Hide key" : "Reveal key"}
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={regenerate}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Generate new key
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setRevoked((r) => !r)}
              disabled={revoked}
            >
              Revoke
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glow-card">
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Quota</h2>
        </CardHeader>
        <CardContent>
          <p className="metric text-2xl font-semibold text-foreground">
            {usageSummary.requestsUsed.toLocaleString()} / {usageSummary.requestsLimit.toLocaleString()}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${usagePct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {usageSummary.planName} plan &middot; resets {usageSummary.renewsOn}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
