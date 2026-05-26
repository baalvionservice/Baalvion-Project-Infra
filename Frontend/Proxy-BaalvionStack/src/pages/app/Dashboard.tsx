import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Zap, Globe, TrendingUp, ArrowUpRight, ArrowDownRight, Users } from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { CountryAlertsPanel } from "@/components/admin/CountryAlertsPanel";
import { IPPoolHealthSection } from "@/components/admin/IPPoolHealthSection";
import { UsageForecastCard } from "@/components/dashboard/UsageForecastCard";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import {
  useDashboardSummary, useBandwidth, useSuccessRate,
  useTopCountries, useTopDomains, useSubUsers,
} from "@/hooks/usePlatform";

const COLORS = ["hsl(199, 89%, 48%)", "hsl(142, 71%, 45%)", "hsl(280, 67%, 60%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export default function Dashboard() {
  const [selectedSubUser, setSelectedSubUser] = useState("all");

  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();
  const { data: bandwidthData = [] } = useBandwidth(30);
  const { data: successRateRaw = [] } = useSuccessRate(30);
  const { data: topCountries = [] } = useTopCountries();
  const { data: topDomains = [] } = useTopDomains();
  const { data: subUsers = [] } = useSubUsers();

  const successRateData = successRateRaw.map(d => ({
    date: d.date,
    success: Math.round(d.value),
    error: Math.round(100 - d.value),
  }));

  const statCards = [
    {
      title: "Total Bandwidth",
      value: summary ? `${summary.bandwidthUsedGb.toFixed(1)} GB` : "–",
      change: summary?.bandwidthChangePercent != null
        ? `${summary.bandwidthChangePercent > 0 ? "+" : ""}${summary.bandwidthChangePercent.toFixed(1)}%`
        : null,
      trend: "up",
      icon: Activity,
    },
    {
      title: "Active Proxies",
      value: summary?.activeProxies?.toLocaleString() ?? "–",
      change: null,
      trend: "up",
      icon: Globe,
    },
    {
      title: "Success Rate",
      value: summary ? `${summary.successRate.toFixed(1)}%` : "–",
      change: null,
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Avg Latency",
      value: summary ? `${summary.avgLatency}ms` : "–",
      change: null,
      trend: "down",
      icon: Zap,
    },
  ];

  const filteredSubUsers = selectedSubUser === "all"
    ? subUsers
    : subUsers.filter(u => u.id === selectedSubUser);

  const usagePct = summary
    ? Math.min(100, Math.round((summary.bandwidthUsedGb / summary.bandwidthLimitGb) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <SEOHead title="Dashboard" description="Monitor your proxy network performance, bandwidth usage, and real-time analytics." />

      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your proxy network overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingSummary ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title} variant="stats">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                {stat.change && (
                  <div className="flex items-center gap-1 mt-3">
                    {stat.trend === "up"
                      ? <ArrowUpRight className="w-4 h-4 text-success" />
                      : <ArrowDownRight className="w-4 h-4 text-success" />}
                    <span className="text-sm text-success">{stat.change}</span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bandwidth Usage (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bandwidthData}>
                  <defs>
                    <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(199, 89%, 48%)" strokeWidth={2} fill="url(#bandwidthGradient)" name="GB" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Success vs Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={successRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="success" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="error" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Domains & Countries */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Target Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDomains} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(v: number) => [v.toLocaleString(), "Requests"]}
                  />
                  <Bar dataKey="value" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Target Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={topCountries}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {topCountries.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(v: number) => [v.toLocaleString(), "Requests"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {topCountries.slice(0, 5).map((entry, index) => (
                  <div key={entry.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm">{entry.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {entry.percent != null ? `${entry.percent}%` : entry.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-User Usage */}
      <Card variant="default">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sub-User Usage Analytics
            </CardTitle>
            <Select value={selectedSubUser} onValueChange={setSelectedSubUser}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by sub-user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sub-Users</SelectItem>
                {subUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email || u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {subUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No sub-users found.</p>
          ) : (
            <div className="space-y-3">
              {filteredSubUsers.map(u => {
                const used = u.bandwidthUsed ?? 0;
                const limit = u.bandwidthLimit ?? 100;
                const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                return (
                  <div key={u.id} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{u.name || u.email || u.id}</span>
                        <Badge variant={u.status === "pending" ? "warning" : "outline"} className="text-xs">
                          {u.status ?? "active"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{used} / {limit} GB</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct > 90 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <UsageForecastCard />
      <CountryAlertsPanel maxAlerts={4} />
      <IPPoolHealthSection />

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total Requests", value: summary?.totalRequests?.toLocaleString() ?? "–" },
                { label: "Bandwidth Used", value: summary ? `${summary.bandwidthUsedGb.toFixed(1)} GB` : "–" },
                { label: "Success Rate", value: summary ? `${summary.successRate.toFixed(1)}%` : "–", cls: "text-success" },
                { label: "Avg Latency", value: summary ? `${summary.avgLatency}ms` : "–" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="p-4 rounded-lg bg-secondary/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${cls ?? ""}`}>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bandwidth Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-32" />
            ) : summary ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">{summary.bandwidthUsedGb.toFixed(1)} GB</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${usagePct > 90 ? "bg-destructive" : usagePct > 75 ? "bg-warning" : "bg-primary"}`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Limit</span>
                  <span className="font-medium">{summary.bandwidthLimitGb} GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium text-success">
                    {(summary.bandwidthLimitGb - summary.bandwidthUsedGb).toFixed(1)} GB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Proxies</span>
                  <span className="font-medium">{summary.activeProxies}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <OnboardingChecklist />
    </div>
  );
}
