import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Gauge, Shield, Timer, Zap, AlertTriangle, CheckCircle2, XCircle,
  ArrowRightLeft, Database, Clock, TrendingUp
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  bandwidthMeteringData, rateLimitData, sessionManagerData, quotaEnforcementData,
  failoverRoutingData, usageLimiterTimeline, billingTrackingData
} from "@/data/middlewareData";

export default function AdminMiddleware() {
  const [activeTab, setActiveTab] = useState("metering");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Technical Middle Layer</h1>
        <p className="text-muted-foreground mt-1">Bandwidth metering, rate limiting, session management & failover routing</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Sessions", value: sessionManagerData.length.toString(), icon: Timer, color: "text-primary" },
          { label: "Rate Limit Hits", value: "1,247", icon: Shield, color: "text-warning" },
          { label: "Failover Events", value: "12", icon: ArrowRightLeft, color: "text-destructive" },
          { label: "Quota Violations", value: "3", icon: AlertTriangle, color: "text-destructive" },
        ].map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="metering" className="gap-1"><Gauge className="w-4 h-4" />Bandwidth Metering</TabsTrigger>
          <TabsTrigger value="ratelimit" className="gap-1"><Shield className="w-4 h-4" />Rate Limits</TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1"><Timer className="w-4 h-4" />Sessions</TabsTrigger>
          <TabsTrigger value="quotas" className="gap-1"><Database className="w-4 h-4" />Quotas</TabsTrigger>
          <TabsTrigger value="failover" className="gap-1"><ArrowRightLeft className="w-4 h-4" />Failover</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1"><TrendingUp className="w-4 h-4" />Billing</TabsTrigger>
        </TabsList>

        {/* Bandwidth Metering */}
        <TabsContent value="metering" className="mt-4 space-y-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Usage Limiter — Requests vs Limit (Today)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={usageLimiterTimeline}>
                  <defs>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199,89%,48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="requests" stroke="hsl(199,89%,48%)" fill="url(#reqGrad)" strokeWidth={2} name="Requests" />
                  <Area type="monotone" dataKey="limit" stroke="hsl(var(--muted-foreground))" fill="none" strokeDasharray="5 5" strokeWidth={1} name="Limit" />
                  <Area type="monotone" dataKey="throttled" stroke="hsl(0,84%,60%)" fill="none" strokeWidth={2} name="Throttled" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Per-User Bandwidth Metering</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  <div>User</div><div>Plan</div><div>Allocated</div><div>Used</div><div>Rate</div><div>Usage</div><div>Status</div>
                </div>
                {bandwidthMeteringData.map((row) => {
                  const pct = (row.used / row.allocated) * 100;
                  return (
                    <div key={row.id} className="grid grid-cols-7 gap-4 px-4 py-3 text-sm rounded-lg hover:bg-secondary/30 items-center">
                      <div className="font-medium truncate">{row.user}</div>
                      <div><Badge variant="muted" className="text-xs">{row.plan}</Badge></div>
                      <div>{row.allocated} GB</div>
                      <div>{row.used} GB</div>
                      <div>{row.rate} MB/s</div>
                      <div className="w-full"><Progress value={pct} className="h-2" /></div>
                      <div>
                        <Badge variant={row.status === "critical" ? "destructive" : row.status === "warning" ? "secondary" : "outline"} className="text-xs">
                          {row.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limits */}
        <TabsContent value="ratelimit" className="mt-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">API Rate Limit Dashboard</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rateLimitData.map((rl) => {
                  const pct = (rl.current / rl.limit) * 100;
                  return (
                    <div key={rl.endpoint} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={rl.method === "POST" ? "default" : "secondary"} className="text-xs font-mono">{rl.method}</Badge>
                          <span className="font-mono text-sm">{rl.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{rl.current}/{rl.limit} per {rl.window}</span>
                          <Badge variant={rl.status === "critical" ? "destructive" : rl.status === "warning" ? "secondary" : "outline"} className="text-xs">{rl.status}</Badge>
                        </div>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions" className="mt-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Active Session Manager</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  <div>Session</div><div>User</div><div>Type</div><div>IP</div><div>Country</div><div>Duration</div><div>Requests</div><div>Status</div>
                </div>
                {sessionManagerData.map((s) => (
                  <div key={s.id} className="grid grid-cols-8 gap-4 px-4 py-3 text-sm rounded-lg hover:bg-secondary/30 items-center">
                    <div className="font-mono text-xs">{s.id}</div>
                    <div className="truncate">{s.user}</div>
                    <div><Badge variant="muted" className="text-xs">{s.type}</Badge></div>
                    <div className="font-mono text-xs">{s.ip}</div>
                    <div>{s.country}</div>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" />{s.duration}</div>
                    <div>{s.requests.toLocaleString()}</div>
                    <div>
                      <Badge variant={s.status === "throttled" ? "destructive" : "outline"} className="text-xs gap-1">
                        {s.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotas */}
        <TabsContent value="quotas" className="mt-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Quota Enforcement</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotaEnforcementData.map((q) => (
                  <div key={q.user + q.quotaType} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{q.user}</p>
                        <p className="text-xs text-muted-foreground">{q.quotaType}: {q.used} / {q.limit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{q.percent}%</span>
                        <Badge variant={q.percent > 90 ? "destructive" : q.percent > 80 ? "secondary" : "outline"} className="text-xs">{q.action}</Badge>
                      </div>
                    </div>
                    <Progress value={q.percent} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failover */}
        <TabsContent value="failover" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {[failoverRoutingData.primary, failoverRoutingData.secondary, failoverRoutingData.tertiary].map((p, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="muted" className="text-xs">{i === 0 ? "Primary" : i === 1 ? "Secondary" : "Tertiary"}</Badge>
                    <Badge variant={p.status === "healthy" ? "outline" : "destructive"} className="text-xs gap-1">
                      {p.status === "healthy" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {p.status}
                    </Badge>
                  </div>
                  <p className="font-semibold">{p.provider}</p>
                  <p className="text-xs text-muted-foreground">{p.region}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <div><span className="text-muted-foreground">Latency:</span> <span className="font-medium">{p.latency}ms</span></div>
                    <div><span className="text-muted-foreground">Load:</span> <span className="font-medium">{p.load}%</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Failover Routes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failoverRoutingData.routes.map((r) => (
                  <div key={r.from} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{r.from}</span>
                      <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{r.primary} → {r.fallback}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.switchovers} switchovers</span>
                      <Badge variant={r.status === "failover" ? "destructive" : "outline"} className="text-xs">{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tracking */}
        <TabsContent value="billing" className="mt-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Real-Time Billing Tracker</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  <div>User</div><div>Plan</div><div>Base</div><div>Overage</div><div>Add-Ons</div><div>Total</div><div>Status</div>
                </div>
                {billingTrackingData.map((b) => (
                  <div key={b.user} className="grid grid-cols-7 gap-4 px-4 py-3 text-sm rounded-lg hover:bg-secondary/30 items-center">
                    <div className="font-medium truncate">{b.user}</div>
                    <div><Badge variant="muted" className="text-xs">{b.plan}</Badge></div>
                    <div>${b.baseCharge}</div>
                    <div className={b.overageCharge > 0 ? "text-warning" : ""}>${b.overageCharge}</div>
                    <div>${b.addOns}</div>
                    <div className="font-bold">${b.total}</div>
                    <div><Badge variant={b.status === "overage" ? "destructive" : "outline"} className="text-xs">{b.status}</Badge></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}