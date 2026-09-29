import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain, Cpu, Activity, TrendingUp, DollarSign, ShieldAlert, RefreshCw, Loader2, Zap, GitBranch,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  useMlModels, useTrainBanModel, useBanProbabilities, useRouteWeights, useRecomputeWeights,
  usePredictiveFailover, useProviderFeatures, useRefreshFeatures, useAnomalies, useSweepAnomalies,
  useResolveAnomaly, useLatestForecasts, usePlatformForecast, useRunForecasts, useCostOptimization, useIntelSlaRisk,
} from "@/hooks/useAdmin";

const sevVariant: Record<string, "destructive" | "warning" | "secondary"> = {
  critical: "destructive", high: "destructive", medium: "warning", low: "secondary",
};
const pct = (n?: number) => `${Math.round((n ?? 0) * 100)}%`;
const weightColor = (w: number) => (w >= 0.7 ? "bg-success" : w >= 0.4 ? "bg-warning" : "bg-destructive");

export default function AdminIntelligence() {
  const { data: models } = useMlModels();
  const { data: weights } = useRouteWeights();
  const { data: features } = useProviderFeatures();
  const { data: anomalies } = useAnomalies("open");
  const { data: banProbs } = useBanProbabilities(50);
  const { data: forecasts } = useLatestForecasts();
  const { data: platformForecast } = usePlatformForecast(30);
  const { data: costOpt } = useCostOptimization();
  const { data: slaRisk } = useIntelSlaRisk();

  const trainBan = useTrainBanModel();
  const recompute = useRecomputeWeights();
  const failover = usePredictiveFailover();
  const refreshFeatures = useRefreshFeatures();
  const sweep = useSweepAnomalies();
  const resolveAnomaly = useResolveAnomaly();
  const runForecasts = useRunForecasts();

  const weightEntries = Object.entries(weights?.weights ?? {});
  const banModel = (models ?? []).find((m) => m.name === "ban_predictor" && m.status === "active");

  return (
    <div className="space-y-6">
      <SEOHead title="AI Network Intelligence" description="Autonomous routing brain, ban prediction, anomaly detection, forecasting and cost optimization." />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-6 h-6 text-primary" /> AI Network Intelligence</h1>
          <p className="text-muted-foreground">Autonomous routing brain · ban prediction · anomaly detection · forecasting · margin optimization.</p>
        </div>
      </div>

      {/* Headline */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ban model AUC" value={banModel ? Number(banModel.metrics?.auc ?? 0).toFixed(3) : "—"} icon={ShieldAlert} />
        <StatCard label="Providers weighted" value={weightEntries.length} icon={Zap} />
        <StatCard label="Open anomalies" value={(anomalies ?? []).length} icon={Activity} tone={(anomalies ?? []).length ? "warning" : undefined} />
        <StatCard label="Forecast 30d (GB)" value={platformForecast?.total != null ? Math.round(platformForecast.total).toLocaleString() : "—"} icon={TrendingUp} />
      </div>

      <Tabs defaultValue="routing">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="routing"><Zap className="w-4 h-4 mr-1" /> Routing Brain</TabsTrigger>
          <TabsTrigger value="ban"><ShieldAlert className="w-4 h-4 mr-1" /> Ban Prediction</TabsTrigger>
          <TabsTrigger value="anomalies"><Activity className="w-4 h-4 mr-1" /> Anomalies</TabsTrigger>
          <TabsTrigger value="forecasts"><TrendingUp className="w-4 h-4 mr-1" /> Forecasts</TabsTrigger>
          <TabsTrigger value="cost"><DollarSign className="w-4 h-4 mr-1" /> Cost Optimization</TabsTrigger>
          <TabsTrigger value="models"><Cpu className="w-4 h-4 mr-1" /> Models</TabsTrigger>
          <TabsTrigger value="sla"><GitBranch className="w-4 h-4 mr-1" /> SLA Risk</TabsTrigger>
        </TabsList>

        {/* ── Routing brain ── */}
        <TabsContent value="routing">
          <div className="flex justify-end gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => refreshFeatures.mutate()} disabled={refreshFeatures.isPending}>
              {refreshFeatures.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Refresh Features
            </Button>
            <Button variant="outline" size="sm" onClick={() => failover.mutate()} disabled={failover.isPending}>
              {failover.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Activity className="w-4 h-4 mr-1" />} Predictive Failover
            </Button>
            <Button size="sm" onClick={() => recompute.mutate()} disabled={recompute.isPending}>
              {recompute.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />} Recompute Weights
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Published Provider Weights</CardTitle><CardDescription>Live AI routing weights consumed by the gateway (0 = avoid, 1 = preferred).</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {weightEntries.length === 0 ? <Empty msg="No weights published yet. Recompute once provider features exist." /> :
                weightEntries.sort((a, b) => b[1] - a[1]).map(([name, w]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span className="font-mono">{w.toFixed(3)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full ${weightColor(w)}`} style={{ width: `${w * 100}%` }} />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle>Provider Feature Store</CardTitle><CardDescription>Engineered features powering the routing score.</CardDescription></CardHeader>
            <CardContent>
              {(features ?? []).length === 0 ? <Empty msg="Feature store empty — refresh after traffic flows." /> : (
                <div className="space-y-1 text-sm">
                  <div className="grid grid-cols-6 gap-2 px-3 py-1 text-xs text-muted-foreground font-medium">
                    <span>Provider</span><span>Success</span><span>Ban</span><span>p95</span><span>$/GB</span><span>Efficiency</span>
                  </div>
                  {(features ?? []).map((f) => (
                    <div key={f.provider} className="grid grid-cols-6 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                      <span className="truncate font-medium">{f.provider}</span>
                      <span>{pct(f.success_rate)}</span>
                      <span>{pct(f.ban_rate)}</span>
                      <span>{Math.round(f.p95_latency)}ms</span>
                      <span>${Number(f.cost_per_gb).toFixed(2)}</span>
                      <span className="font-mono">{Number(f.efficiency).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Ban prediction ── */}
        <TabsContent value="ban">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => trainBan.mutate(14)} disabled={trainBan.isPending}>
              {trainBan.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Cpu className="w-4 h-4 mr-1" />} Train Ban Model
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Highest Ban-Probability Routes</CardTitle><CardDescription>provider · country · target-class with predicted ban likelihood (logistic regression).</CardDescription></CardHeader>
            <CardContent>
              {(banProbs ?? []).length === 0 ? <Empty msg="No ban-probability scores yet. Train the model + run scoring." /> : (
                <div className="space-y-1 text-sm">
                  {(banProbs ?? []).map((b) => (
                    <div key={b.route_key} className="flex items-center justify-between px-3 py-2 rounded bg-secondary/30">
                      <code className="font-mono text-xs truncate">{b.route_key}</code>
                      <div className="flex items-center gap-2 w-40">
                        <Progress value={b.ban_probability * 100} className="h-2" />
                        <Badge variant={b.ban_probability >= 0.6 ? "destructive" : b.ban_probability >= 0.3 ? "warning" : "success"}>{pct(b.ban_probability)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Anomalies ── */}
        <TabsContent value="anomalies">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="outline" onClick={() => sweep.mutate()} disabled={sweep.isPending}>
              {sweep.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Run Sweep
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Open Anomalies</CardTitle><CardDescription>Robust-z / EWMA detections across providers, orgs and regions.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(anomalies ?? []).length === 0 ? <Empty msg="No open anomalies. The network is behaving normally." /> :
                (anomalies ?? []).map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={sevVariant[a.severity] || "secondary"}>{a.severity}</Badge>
                        <span className="text-sm font-medium">{a.metric}</span>
                        <span className="text-xs text-muted-foreground">{a.scope} · {String(a.entity_id).slice(0, 12)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">observed {Number(a.observed).toFixed(1)} vs expected {Number(a.expected).toFixed(1)} (z={Number(a.score).toFixed(1)})</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => resolveAnomaly.mutate({ id: a.id, status: "resolved" })}>Resolve</Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Forecasts ── */}
        <TabsContent value="forecasts">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => runForecasts.mutate()} disabled={runForecasts.isPending}>
              {runForecasts.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-1" />} Run Forecasts
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Platform Bandwidth (30d)</CardTitle><CardDescription>{platformForecast?.seasonal ? "Holt-Winters seasonal" : "Holt linear"} projection.</CardDescription></CardHeader>
              <CardContent>
                {!platformForecast || platformForecast.insufficientData ? <Empty msg="Not enough history to forecast yet." /> : (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{Math.round(platformForecast.total).toLocaleString()} GB</p>
                    <p className="text-xs text-muted-foreground">projected total over next 30 days</p>
                    <Sparkline points={(platformForecast.points ?? []).map((p) => p.yhat)} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Latest Forecasts</CardTitle><CardDescription>Per-entity headline numbers.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {(forecasts ?? []).length === 0 ? <Empty msg="No forecasts yet." /> :
                  (forecasts ?? []).slice(0, 12).map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded bg-secondary/30">
                      <span className="truncate"><Badge variant="secondary" className="mr-2">{f.metric}</Badge>{f.entity_type}:{String(f.entity_id).slice(0, 10)}</span>
                      <span className="font-mono">{f.point_value != null ? Number(f.point_value).toLocaleString() : "—"}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Cost optimization ── */}
        <TabsContent value="cost">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Offload Recommendations</CardTitle><CardDescription>Shift volume to cheaper, healthy providers.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {(costOpt?.offloadRecommendations ?? []).length === 0 ? <Empty msg="No offload opportunities detected." /> :
                  (costOpt?.offloadRecommendations ?? []).map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 text-sm">
                      <span>{r.from} → <span className="font-medium">{r.to}</span></span>
                      <Badge variant="success">save ${r.estMonthlySaving.toLocaleString()}/mo</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Low-Margin Customers</CardTitle><CardDescription>Revenue/GB below the margin floor.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {(costOpt?.lowMarginCustomers ?? []).length === 0 ? <Empty msg="All customers above the margin floor." /> :
                  (costOpt?.lowMarginCustomers ?? []).slice(0, 12).map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 text-sm">
                      <span><code className="font-mono text-xs">{c.orgId.slice(0, 10)}</code> <Badge variant="secondary" className="ml-1">{c.plan}</Badge></span>
                      <span className="text-muted-foreground">${c.revPerGb}/GB · {c.gb} GB</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Models ── */}
        <TabsContent value="models">
          <Card>
            <CardHeader><CardTitle>Model Registry</CardTitle><CardDescription>Versioned models (Node + sklearn) with active/shadow status.</CardDescription></CardHeader>
            <CardContent>
              {(models ?? []).length === 0 ? <Empty msg="No models registered yet. Train the ban model to create the first version." /> : (
                <div className="space-y-1 text-sm">
                  <div className="grid grid-cols-5 gap-2 px-3 py-1 text-xs text-muted-foreground font-medium">
                    <span className="col-span-2">Model</span><span>Algorithm</span><span>Status</span><span>Quality</span>
                  </div>
                  {(models ?? []).map((m) => (
                    <div key={`${m.name}-${m.version}`} className="grid grid-cols-5 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                      <span className="col-span-2 truncate">{m.name} <span className="text-muted-foreground">v{m.version}</span></span>
                      <span className="text-xs">{m.algorithm} <span className="text-muted-foreground">({m.framework})</span></span>
                      <Badge variant={m.status === "active" ? "success" : m.status === "shadow" ? "warning" : "secondary"} className="w-fit">{m.status}</Badge>
                      <span className="font-mono text-xs">{m.metrics?.auc != null ? `AUC ${Number(m.metrics.auc).toFixed(3)}` : m.metrics?.mae != null ? `MAE ${Number(m.metrics.mae).toFixed(2)}` : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SLA risk ── */}
        <TabsContent value="sla">
          <Card>
            <CardHeader><CardTitle>Enterprise SLA Risk</CardTitle><CardDescription>Predicted breach risk from latency trend + provider/region health.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(slaRisk ?? []).length === 0 ? <Empty msg="No enterprise orgs evaluated, or none at risk." /> :
                (slaRisk ?? []).map((s) => (
                  <div key={s.orgId} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <code className="font-mono text-xs">{s.orgId.slice(0, 12)}</code>
                      <span className="text-xs text-muted-foreground ml-2">p95 {Math.round(s.latencyP95)}ms · uptime {(s.uptime * 100).toFixed(2)}%</span>
                    </div>
                    <Badge variant={s.risk >= 0.8 ? "destructive" : s.risk >= 0.6 ? "warning" : "success"}>{pct(s.risk)} risk</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Brain; tone?: "warning" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${tone === "warning" ? "text-warning" : ""}`}>{value}</p>
          </div>
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

const Empty = ({ msg }: { msg: string }) => <p className="text-sm text-muted-foreground py-6 text-center">{msg}</p>;

function Sparkline({ points }: { points: number[] }) {
  if (!points.length) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 100, h = 28;
  const d = points.map((p, i) => `${(i / (points.length - 1 || 1)) * w},${h - ((p - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10 mt-2" preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    </svg>
  );
}
