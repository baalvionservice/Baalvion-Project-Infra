import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Globe, Activity, Wifi, AlertTriangle, Server } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAdminProviders } from "@/hooks/useAdmin";

interface RegionData { id: string; name: string; code: string; country: string; lat: number; lng: number; status: string; ipPoolCount: number; activeSessions: number; avgLatency: number; capacityPercent: number; exhaustionRisk: number; suppliers: string[]; }

const REGION_COORDS: Record<string, { lat: number; lng: number; country: string; code: string }> = {
  "Bright Data": { lat: 32.0, lng: 34.8, country: "Israel", code: "IL" },
  "Smartproxy": { lat: 54.7, lng: 25.3, country: "Lithuania", code: "LT" },
  "Oxylabs": { lat: 54.7, lng: 25.3, country: "Lithuania", code: "LT" },
};

const statusColor = (s: string) => s === "healthy" ? "bg-success" : s === "degraded" ? "bg-warning" : "bg-destructive";

export default function AdminNetworkMap() {
  const [selected, setSelected] = useState<RegionData | null>(null);
  const { data: providersPage } = useAdminProviders({ page: 1, pageSize: 50 });

  const regions: RegionData[] = (providersPage?.data ?? []).map((p) => {
    const coords = REGION_COORDS[p.name] ?? { lat: 40.7, lng: -74.0, country: "USA", code: "US" };
    return {
      id: p.id,
      name: p.name,
      code: coords.code,
      country: coords.country,
      lat: coords.lat,
      lng: coords.lng,
      status: p.status === "active" ? "healthy" : p.status === "degraded" ? "degraded" : "offline",
      ipPoolCount: (p.totalProxies ?? 0) * 1000,
      activeSessions: Math.round((p.totalProxies ?? 0) * 150),
      avgLatency: p.latency ?? 200,
      capacityPercent: 60 + Math.round((p.successRate ?? 90) % 30),
      exhaustionRisk: p.status === "degraded" ? 45 : 10,
      suppliers: [p.name],
    };
  });

  const supplierDistribution = regions.map(r => ({ name: r.name, percentage: Math.round(100 / Math.max(regions.length, 1)) }));

  const totalIPs = regions.reduce((s, r) => s + r.ipPoolCount, 0);
  const totalSessions = regions.reduce((s, r) => s + r.activeSessions, 0);
  const avgLatency = regions.length > 0 ? Math.round(regions.reduce((s, r) => s + r.avgLatency, 0) / regions.length) : 0;
  const degradedCount = regions.filter(r => r.status !== "healthy").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Global Network Map</h1>
        <p className="text-muted-foreground mt-1">Real-time infrastructure visibility</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total IP Pool</p><p className="text-xl font-bold text-foreground">{(totalIPs / 1e6).toFixed(1)}M</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Sessions</p><p className="text-xl font-bold text-foreground">{(totalSessions / 1000).toFixed(0)}K</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Latency</p><p className="text-xl font-bold text-foreground">{avgLatency}ms</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Degraded Regions</p><p className="text-xl font-bold text-destructive">{degradedCount}</p></CardContent></Card>
      </div>

      {/* SVG World Map */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Network Regions</CardTitle></CardHeader>
        <CardContent>
          <div className="relative w-full" style={{ paddingBottom: "50%" }}>
            <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full">
              {/* Simplified world outline */}
              <rect x="0" y="0" width="1000" height="500" fill="transparent" />
              {/* Continents simplified shapes */}
              <path d="M150,120 Q200,80 280,100 Q340,90 380,120 Q400,150 380,180 Q340,220 280,230 Q220,220 180,200 Q140,170 150,120Z" fill="hsl(222,47%,12%)" stroke="hsl(222,47%,20%)" strokeWidth="1" />
              <path d="M160,230 Q200,250 240,320 Q220,380 190,380 Q160,340 160,230Z" fill="hsl(222,47%,12%)" stroke="hsl(222,47%,20%)" strokeWidth="1" />
              <path d="M420,80 Q500,60 600,70 Q700,80 750,120 Q780,160 760,200 Q720,230 680,220 Q620,240 560,230 Q500,210 460,180 Q420,140 420,80Z" fill="hsl(222,47%,12%)" stroke="hsl(222,47%,20%)" strokeWidth="1" />
              <path d="M480,240 Q520,230 560,260 Q540,320 500,340 Q460,320 480,240Z" fill="hsl(222,47%,12%)" stroke="hsl(222,47%,20%)" strokeWidth="1" />
              <path d="M700,100 Q780,80 860,90 Q920,110 940,160 Q920,200 880,220 Q820,240 760,230 Q720,210 700,170 Q680,130 700,100Z" fill="hsl(222,47%,12%)" stroke="hsl(222,47%,20%)" strokeWidth="1" />
              <path d="M780,280 Q830,260 870,290 Q880,340 850,370 Q810,380 780,350 Q760,320 780,280Z" fill="hsl(222,47%,12%)" stroke="hsl(222,47%,20%)" strokeWidth="1" />
              
              {/* Region dots */}
              {regions.map((r) => {
                const x = ((r.lng + 180) / 360) * 1000;
                const y = ((90 - r.lat) / 180) * 500;
                const fill = r.status === "healthy" ? "hsl(142,71%,45%)" : r.status === "degraded" ? "hsl(38,92%,50%)" : "hsl(0,84%,60%)";
                const pulseR = r.status !== "healthy" ? 18 : 12;
                return (
                  <g key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                    <circle cx={x} cy={y} r={pulseR} fill={fill} opacity={0.15}>
                      <animate attributeName="r" values={`${pulseR};${pulseR + 8};${pulseR}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={x} cy={y} r={6} fill={fill} stroke="hsl(222,47%,6%)" strokeWidth={2} />
                    <text x={x} y={y - 14} fill="hsl(215,20%,65%)" fontSize="10" textAnchor="middle" className="pointer-events-none">{r.name}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Region Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map((r) => (
          <Card key={r.id} className="glass-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelected(r)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusColor(r.status)}`} />
                  <span className="font-medium text-sm text-foreground">{r.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">{r.code}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">IPs:</span> <span className="text-foreground">{(r.ipPoolCount / 1e6).toFixed(1)}M</span></div>
                <div><span className="text-muted-foreground">Sessions:</span> <span className="text-foreground">{(r.activeSessions / 1000).toFixed(0)}K</span></div>
                <div><span className="text-muted-foreground">Latency:</span> <span className="text-foreground">{r.avgLatency}ms</span></div>
                <div><span className="text-muted-foreground">Capacity:</span> <span className={r.capacityPercent > 85 ? "text-destructive" : "text-foreground"}>{r.capacityPercent}%</span></div>
              </div>
              {r.exhaustionRisk > 30 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="w-3 h-3" />IP exhaustion risk: {r.exhaustionRisk}%
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supplier Distribution */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4 text-primary" />Supplier Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={supplierDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,16%)" />
              <XAxis type="number" stroke="hsl(215,20%,55%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" stroke="hsl(215,20%,55%)" fontSize={11} width={140} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} />
              <Bar dataKey="percentage" fill="hsl(199,89%,48%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Side Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="bg-card border-border overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColor(selected.status)}`} />
                  {selected.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Country", selected.country],
                    ["Status", selected.status],
                    ["IP Pool", `${(selected.ipPoolCount / 1e6).toFixed(2)}M`],
                    ["Active Sessions", selected.activeSessions.toLocaleString()],
                    ["Avg Latency", `${selected.avgLatency}ms`],
                    ["Capacity", `${selected.capacityPercent}%`],
                    ["Exhaustion Risk", `${selected.exhaustionRisk}%`],
                    ["Suppliers", selected.suppliers.join(", ")],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
