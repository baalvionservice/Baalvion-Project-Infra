import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Activity, TrendingUp, Layers, Gauge, ShieldCheck } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  useGeoHeatmap, useTrafficIntelligence, useProviderMix,
  useBandwidthForecast, useQuotaForecast, useSlaRiskInsight,
} from "@/hooks/usePlatform";

export default function NetworkAnalytics() {
  const { data: geo } = useGeoHeatmap();
  const { data: traffic } = useTrafficIntelligence();
  const { data: mix } = useProviderMix();
  const { data: forecast } = useBandwidthForecast(30);
  const { data: quota } = useQuotaForecast();
  const { data: sla } = useSlaRiskInsight();

  const maxGeo = Math.max(...(geo ?? []).map((g) => g.gb), 1);

  return (
    <div className="space-y-6">
      <SEOHead title="Network Analytics" description="AI-powered analytics: geo heatmap, traffic intelligence, forecasts and SLA risk." />
      <div>
        <h1 className="text-2xl font-bold">Network Analytics & AI Insights</h1>
        <p className="text-muted-foreground">Real measurements + AI forecasts for your organization's traffic.</p>
      </div>

      {/* Headline insights */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Forecast bandwidth (30d)</p>
                <p className="text-2xl font-bold">{forecast?.insufficientData ? "—" : `${Math.round(forecast?.total ?? 0).toLocaleString()} GB`}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            {!forecast?.insufficientData && <Sparkline points={(forecast?.points ?? []).map((p) => p.yhat)} />}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Quota runway</p>
                <p className="text-2xl font-bold">{quota?.insufficientData || quota?.daysToIncluded == null ? "—" : `${quota.daysToIncluded}d`}</p>
              </div>
              <Gauge className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {quota && !quota.insufficientData ? `${quota.usedGb} / ${quota.includedGb} GB used · ${quota.dailyRateGb} GB/day` : "needs more usage history"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">SLA risk</p>
                <p className="text-2xl font-bold">{sla ? `${Math.round((sla.risk ?? 0) * 100)}%` : "—"}</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sla ? `p95 ${Math.round(sla.latencyP95)}ms · uptime ${(sla.uptime * 100).toFixed(2)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="geo">
        <TabsList>
          <TabsTrigger value="geo"><Globe className="w-4 h-4 mr-1" /> Geo Heatmap</TabsTrigger>
          <TabsTrigger value="traffic"><Activity className="w-4 h-4 mr-1" /> Traffic Intelligence</TabsTrigger>
          <TabsTrigger value="mix"><Layers className="w-4 h-4 mr-1" /> Provider Mix</TabsTrigger>
          <TabsTrigger value="forecast"><TrendingUp className="w-4 h-4 mr-1" /> Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="geo">
          <Card>
            <CardHeader><CardTitle>Traffic by Country</CardTitle><CardDescription>Requests, bandwidth and measured latency per country (last 7 days).</CardDescription></CardHeader>
            <CardContent>
              {(geo ?? []).length === 0 ? <Empty msg="No geo traffic yet." /> : (
                <div className="space-y-2">
                  {(geo ?? []).map((g) => (
                    <div key={g.country} className="flex items-center gap-3 text-sm">
                      <span className="w-10 font-medium">{g.country}</span>
                      <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(g.gb / maxGeo) * 100}%` }} />
                      </div>
                      <span className="w-20 text-right">{g.gb} GB</span>
                      <span className="w-24 text-right text-muted-foreground">{g.requests.toLocaleString()} req</span>
                      <span className="w-20 text-right text-muted-foreground">{g.p95Latency || g.p50Latency || 0}ms p95</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Latency Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(traffic?.latencyDistribution ?? []).map((b) => {
                  const total = (traffic?.latencyDistribution ?? []).reduce((s, x) => s + x.count, 0) || 1;
                  return (
                    <div key={b.label} className="flex items-center gap-3 text-sm">
                      <span className="w-24">{b.label}</span>
                      <Progress value={(b.count / total) * 100} className="h-2 flex-1" />
                      <span className="w-16 text-right text-muted-foreground">{b.count.toLocaleString()}</span>
                    </div>
                  );
                })}
                {(traffic?.latencyDistribution ?? []).length === 0 && <Empty msg="No latency data yet." />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top Destinations</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(traffic?.topDomains ?? []).length === 0 ? <Empty msg="No destination data yet." /> :
                  (traffic?.topDomains ?? []).map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-sm px-3 py-2 rounded bg-secondary/30">
                      <span className="truncate">{d.label}</span>
                      <span className="text-muted-foreground">{d.value.toLocaleString()}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mix">
          <Card>
            <CardHeader><CardTitle>Provider Mix</CardTitle><CardDescription>How your traffic was routed across providers (last 30 days).</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(mix ?? []).length === 0 ? <Empty msg="No provider routing data yet." /> :
                (mix ?? []).map((m) => (
                  <div key={m.provider} className="flex items-center gap-3 text-sm">
                    <span className="w-32 truncate font-medium">{m.provider}</span>
                    <Progress value={m.share} className="h-2 flex-1" />
                    <span className="w-16 text-right">{m.share}%</span>
                    <span className="w-20 text-right text-muted-foreground">{m.gb} GB</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
          <Card>
            <CardHeader><CardTitle>Bandwidth Forecast (30 days)</CardTitle><CardDescription>{forecast?.seasonal ? "Holt-Winters seasonal model" : "Holt linear trend"} with confidence band.</CardDescription></CardHeader>
            <CardContent>
              {!forecast || forecast.insufficientData ? <Empty msg="Not enough usage history to forecast yet (need ~4+ days)." /> : (
                <div>
                  <p className="text-3xl font-bold mb-1">{Math.round(forecast.total).toLocaleString()} GB</p>
                  <p className="text-xs text-muted-foreground mb-4">projected over the next 30 days</p>
                  <Sparkline points={forecast.points.map((p) => p.yhat)} large />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
                    {forecast.points.filter((_, i) => i % 7 === 0).map((p) => (
                      <div key={p.date} className="p-2 rounded bg-secondary/30">
                        <div className="text-muted-foreground">{p.date.slice(5)}</div>
                        <div className="font-semibold">{Math.round(p.yhat)} GB</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Empty = ({ msg }: { msg: string }) => <p className="text-sm text-muted-foreground py-6 text-center">{msg}</p>;

function Sparkline({ points, large }: { points: number[]; large?: boolean }) {
  if (!points.length) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 100, h = 28;
  const d = points.map((p, i) => `${(i / (points.length - 1 || 1)) * w},${h - ((p - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={large ? "w-full h-24" : "w-full h-10 mt-2"} preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    </svg>
  );
}
