import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Activity, Globe, ShieldAlert, Network, Route, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  useProviderStates, useRoutingPolicies, useIpIntelligence, useGeoCoverage,
  useOrchestrationSessions, useBanAnalytics,
} from "@/hooks/useAdmin";

const stateVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  HEALTHY: "success", DEGRADED: "warning", UNHEALTHY: "destructive", OFFLINE: "secondary", UNKNOWN: "secondary",
};

const pct = (n?: number) => `${Math.round((n ?? 0) * 100)}%`;

export default function AdminOrchestration() {
  const { data: providers, isLoading: provLoading } = useProviderStates();
  const { data: policies } = useRoutingPolicies();
  const { data: ipIntel } = useIpIntelligence({ limit: 50 });
  const { data: coverage } = useGeoCoverage();
  const { data: sessions } = useOrchestrationSessions();
  const { data: bans } = useBanAnalytics();

  return (
    <div className="space-y-6">
      <SEOHead title="Provider Orchestration" description="Live provider health, routing, IP intelligence and ban analytics." />
      <div>
        <h1 className="text-2xl font-bold">Provider Orchestration</h1>
        <p className="text-muted-foreground">Live routing brain — provider health, policies, IP intelligence and abuse signals.</p>
      </div>

      {/* Provider health grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2"><Server className="w-4 h-4" /> Provider Health (live)</h2>
        {provLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : (providers ?? []).length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No providers reporting. Configure providers and start the gateway.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(providers ?? []).map((p) => (
              <Card key={p.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant={stateVariant[p.health.state] || "secondary"}>{p.health.state}</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {p.config?.proxy_type || "—"} · {p.config?.kind || "—"} · ${Number(p.config?.cost_per_gb ?? 0).toFixed(2)}/GB
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 text-sm">
                  <div><div className="text-xs text-muted-foreground">Success</div><div className="font-semibold">{pct(p.health.successRate)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Latency</div><div className="font-semibold">{Math.round(p.health.latencyMs ?? 0)}ms</div></div>
                  <div><div className="text-xs text-muted-foreground">Ban</div><div className="font-semibold">{pct(p.health.banRate)}</div></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="routing">
        <TabsList>
          <TabsTrigger value="routing"><Route className="w-4 h-4 mr-1" /> Routing</TabsTrigger>
          <TabsTrigger value="ip"><Network className="w-4 h-4 mr-1" /> IP Intelligence</TabsTrigger>
          <TabsTrigger value="geo"><Globe className="w-4 h-4 mr-1" /> Geo Coverage</TabsTrigger>
          <TabsTrigger value="sessions"><Activity className="w-4 h-4 mr-1" /> Sessions</TabsTrigger>
          <TabsTrigger value="bans"><ShieldAlert className="w-4 h-4 mr-1" /> Ban Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="routing">
          <Card>
            <CardHeader><CardTitle>Routing Policies</CardTitle><CardDescription>Strategy + provider allow/deny by plan and geo.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(policies ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No routing policies — gateway uses plan-derived defaults.</p> :
                (policies ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{p.planSlug || "global"} · {p.country || "any"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{p.strategy}</Badge>
                      <Badge variant={p.enabled ? "success" : "secondary"}>{p.enabled ? "enabled" : "off"}</Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ip">
          <Card>
            <CardHeader><CardTitle>IP Intelligence</CardTitle><CardDescription>Exit-IP health, latency, ban + abuse scores.</CardDescription></CardHeader>
            <CardContent>
              {(ipIntel ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No IP intelligence yet (populated as the gateway routes real traffic).</p> : (
                <div className="space-y-1 text-sm">
                  <div className="grid grid-cols-6 gap-2 px-3 py-1 text-xs text-muted-foreground font-medium">
                    <span>IP</span><span>Provider</span><span>Country</span><span>Latency</span><span>Success</span><span>Health</span>
                  </div>
                  {(ipIntel ?? []).map((r) => (
                    <div key={r.ip} className="grid grid-cols-6 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                      <code className="font-mono text-xs truncate">{r.ip}</code>
                      <span className="truncate">{r.provider}</span>
                      <span>{r.country?.toUpperCase()}</span>
                      <span>{r.latency_ms}ms</span>
                      <span>{pct(r.success_rate)}</span>
                      <Badge variant={r.health_score >= 75 ? "success" : r.health_score >= 40 ? "warning" : "destructive"} className="w-fit">{Math.round(r.health_score)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geo">
          <Card>
            <CardHeader><CardTitle>Geo Coverage</CardTitle><CardDescription>Provider count per country.</CardDescription></CardHeader>
            <CardContent>
              {(coverage ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No geo capabilities configured.</p> : (
                <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {(coverage ?? []).map((c) => (
                    <div key={c.country} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <span className="font-medium">{(c.country || "—").toUpperCase()}</span>
                      <Badge variant="info">{c.providers} providers</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader><CardTitle>Active Proxy Sessions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(sessions ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No active sessions.</p> :
                (sessions ?? []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="min-w-0">
                      <span className="text-sm">{s.provider} · {s.country?.toUpperCase() || "ANY"}</span>
                      <code className="text-xs text-muted-foreground ml-2 font-mono">{s.org_id.slice(0, 8)}</code>
                    </div>
                    <Badge variant="secondary">{s.rotation}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bans">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Provider Ban Rates</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(bans?.providerBanRates ?? []).map((b) => (
                  <div key={b.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <span className="font-medium">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{pct(b.banRate)}</span>
                      <Badge variant={stateVariant[b.state] || "secondary"}>{b.state}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Abuse Events (24h)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(bans?.last24h ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No abuse events.</p> :
                  (bans?.last24h ?? []).map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <span className="text-sm">{e.event_type}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={e.severity === "high" ? "destructive" : "warning"}>{e.severity}</Badge>
                        <span className="text-sm font-semibold">{e.n}</span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
