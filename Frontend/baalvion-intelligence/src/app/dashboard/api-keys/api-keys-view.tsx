"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, RotateCcw, Ban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuthedFetch } from "@/lib/auth/use-authed-fetch";
import { dailyLimitFromScopes, planLabelFromScopes } from "@/lib/plan-quota";
import type { ApiKeyRecord } from "@/lib/types";

function mask(prefix: string, last4: string): string {
  return `${prefix}${"•".repeat(12)}${last4}`;
}

export function ApiKeysView() {
  const authedFetch = useAuthedFetch();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [revealedKey, setRevealedKey] = useState<ApiKeyRecord | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authedFetch<{ items: ApiKeyRecord[] }>("/api/keys");
      if (data.items.length === 0) {
        const issued = await authedFetch<ApiKeyRecord>("/api/keys", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Default key" }),
        });
        setKeys([issued]);
        setRevealedKey(issued);
        setIsRevealed(true);
      } else {
        setKeys(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your API keys.");
    } finally {
      setIsLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function regenerate(id: string) {
    setIsMutating(true);
    setError(null);
    try {
      const rotated = await authedFetch<ApiKeyRecord>(`/api/keys/${id}/rotate`, { method: "POST" });
      setKeys((prev) => prev.map((k) => (k.id === id ? rotated : k)));
      setRevealedKey(rotated);
      setIsRevealed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't rotate the key.");
    } finally {
      setIsMutating(false);
    }
  }

  async function revoke(id: string) {
    setIsMutating(true);
    setError(null);
    try {
      const revoked = await authedFetch<ApiKeyRecord>(`/api/keys/${id}/revoke`, { method: "POST" });
      setKeys((prev) => prev.map((k) => (k.id === id ? revoked : k)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't revoke the key.");
    } finally {
      setIsMutating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading your API keys…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-signal-negative/30 bg-signal-negative/10 px-4 py-3 text-sm text-signal-negative">
          {error}
        </p>
      )}

      {keys.map((key) => {
        const showingPlaintext = revealedKey?.id === key.id && Boolean(revealedKey.key) && isRevealed;
        const plan = planLabelFromScopes(key.scopes);
        const dailyLimit = dailyLimitFromScopes(key.scopes);

        return (
          <Card key={key.id} className="glow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <h2 className="text-base font-semibold text-foreground">{key.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {plan} plan &middot; {dailyLimit.toLocaleString()} requests/day
                </p>
              </div>
              <Badge variant={key.status === "revoked" ? "negative" : "positive"}>
                {key.status === "revoked" ? "Revoked" : "Active"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <code className="flex-1 truncate font-mono text-sm text-foreground/90">
                  {showingPlaintext ? revealedKey!.key : mask(key.key_prefix, key.last4)}
                </code>
                {revealedKey?.id === key.id && revealedKey.key && (
                  <button
                    type="button"
                    onClick={() => setIsRevealed((r) => !r)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={isRevealed ? "Hide key" : "Reveal key"}
                  >
                    {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {revealedKey?.id === key.id && revealedKey.key && (
                <p className="text-xs text-muted-foreground">
                  This is the only time the full key is shown. Copy it now — after you navigate away, only the
                  masked prefix is available.
                </p>
              )}
              {key.status === "active" && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={isMutating} onClick={() => regenerate(key.id)}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    Regenerate
                  </Button>
                  <Button variant="outline" size="sm" disabled={isMutating} onClick={() => revoke(key.id)}>
                    <Ban className="h-3.5 w-3.5" aria-hidden />
                    Revoke
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card className="glow-card">
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Quickstart</h2>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground/90">
            <code>{`curl https://news.baalvion.com/v1/news/trending \\
  -H "Authorization: Bearer ${revealedKey?.key ?? "YOUR_API_KEY"}"`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
