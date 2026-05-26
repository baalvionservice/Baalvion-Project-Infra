import { useState, useRef, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Activity, Download, TrendingUp, TrendingDown, Globe, Zap, BarChart3, PieChart, Calendar, Image, AlertTriangle
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Legend,
  ReferenceDot
} from "recharts";
import { toast } from "sonner";
import { useBandwidth, useSuccessRate, useTopCountries, useTopDomains, useLatencyDistribution, useAnomalies } from "@/hooks/usePlatform";

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 84%, 60%)', 'hsl(215, 20%, 55%)'];

const dateRanges = [
  { value: "1", label: "24 hours", days: 1 },
  { value: "7", label: "7 days", days: 7 },
  { value: "30", label: "30 days", days: 30 },
  { value: "90", label: "90 days", days: 90 },
];

export default function Analytics() {
  const [range, setRange] = useState("7");
  const chartRef = useRef<HTMLDivElement>(null);

  const days = dateRanges.find(r => r.value === range)?.days || 7;

  const { data: bandwidthRaw = [] } = useBandwidth(days);
  const { data: successRateRaw = [] } = useSuccessRate(days);
  const { data: topCountriesRaw = [] } = useTopCountries();
  const { data: topDomainsRaw = [] } = useTopDomains();
  const { data: latencyRaw = [] } = useLatencyDistribution();
  const { data: anomaliesRaw = [] } = useAnomalies();

  const currentData = bandwidthRaw.map((bw, i) => {
    const sr = successRateRaw[i];
    return {
      date: new Date(bw.date).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      requests: Math.round(bw.value * 1000),
      bandwidth: +bw.value.toFixed(1),
      successRate: +(sr?.value ?? 97).toFixed(1),
      avgLatency: 180,
      anomaly: false,
    };
  });

  const byCountry = topCountriesRaw.map(c => ({ country: c.label, percentage: Math.round(c.value) }));
  const byProxyType = [
    { type: "Residential", percentage: 45 }, { type: "Datacenter", percentage: 30 },
    { type: "Mobile", percentage: 15 }, { type: "ISP", percentage: 10 },
  ];
  const topDomains = topDomainsRaw.map(d => ({ domain: d.label, requests: d.value }));
  const latencyDistribution = latencyRaw.map(l => ({ range: l.label, count: l.count }));
  const anomalies = anomaliesRaw;

  const totalRequests = currentData.reduce((s, d) => s + d.requests, 0);
  const totalBandwidth = currentData.reduce((s, d) => s + d.bandwidth, 0);
  const avgSuccessRate = currentData.length > 0
    ? (currentData.reduce((s, d) => s + d.successRate, 0) / currentData.length).toFixed(2)
    : "0.00";
  const avgLatency = currentData.length > 0
    ? Math.round(currentData.reduce((s, d) => s + d.avgLatency, 0) / currentData.length)
    : 0;

  const exportPNG = useCallback((containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) { toast.error("No chart found"); return; }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `chart-${containerId}-${new Date().toISOString().split("T")[0]}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast.success("Chart exported as PNG");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const exportCSV = useCallback(() => {
    const csv = "date,requests,bandwidth,successRate,avgLatency\n" +
      currentData.map(d => `${d.date},${d.requests},${d.bandwidth},${d.successRate},${d.avgLatency}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${range}d-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported as CSV");
  }, [currentData, range]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Analytics" description="Detailed insights into your proxy usage, performance, and traffic distribution." />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your proxy usage and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border/50">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
        </div>
      </div>

      {/* Anomaly Alert */}
      {anomalies.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
          <span className="text-warning font-medium">{anomalies.length} anomalies detected</span>
          <span className="text-muted-foreground">— Traffic spikes identified in the selected period</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: `${(totalRequests / 1000000).toFixed(2)}M`, icon: Activity, change: "+18.2%", color: "text-primary" },
          { label: "Bandwidth Used", value: `${totalBandwidth.toFixed(1)} GB`, icon: BarChart3, change: "+12.5%", color: "text-accent" },
          { label: "Success Rate", value: `${avgSuccessRate}%`, icon: TrendingUp, change: "+0.3%", color: "text-success" },
          { label: "Avg Latency", value: `${avgLatency}ms`, icon: Zap, change: "-8ms", color: "text-warning", down: true },
        ].map(stat => (
          <Card key={stat.label} variant="stats">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {stat.down ? <TrendingDown className="w-4 h-4 text-success" /> : <TrendingUp className="w-4 h-4 text-success" />}
                <span className="text-sm text-success">{stat.change}</span>
                <span className="text-xs text-muted-foreground">vs previous period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requests Over Time */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Requests Over Time</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportPNG("chart-requests")} aria-label="Export chart as PNG">
                <Image className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="chart-requests">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentData}>
                  <defs>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${(value / 1000).toFixed(1)}K`, 'Requests']} />
                  <Area type="monotone" dataKey="requests" stroke="hsl(199, 89%, 48%)" strokeWidth={2} fill="url(#reqGrad)" />
                  {anomalies.map((a, i) => (
                    <ReferenceDot key={i} x={a.date} y={a.requests} r={6} fill="hsl(38, 92%, 50%)" stroke="hsl(38, 92%, 50%)" />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bandwidth Usage */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Bandwidth Usage</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportPNG("chart-bandwidth")} aria-label="Export chart as PNG">
                <Image className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="chart-bandwidth">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v} GB`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toFixed(1)} GB`, 'Bandwidth']} />
                  <Bar dataKey="bandwidth" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* By Country */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg">Top Countries</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={byCountry} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="percentage" nameKey="country" label={({ percentage }) => `${percentage}%`} labelLine={false}>
                    {byCountry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {byCountry.slice(0, 4).map((item, i) => (
                <div key={item.country} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span>{item.country}</span>
                  </div>
                  <span className="text-muted-foreground">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latency Distribution */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              <CardTitle className="text-lg">Latency Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]" id="chart-latency">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), "Requests"]} />
                  <Bar dataKey="count" fill="hsl(280, 65%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 p-2 rounded bg-secondary/30 border border-border/50 text-xs text-muted-foreground">
              P50: 142ms · P95: 380ms · P99: 520ms
            </div>
          </CardContent>
        </Card>

        {/* Top Domains */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              <CardTitle className="text-lg">Top Target Domains</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {topDomains.map((d, i) => (
                <div key={d.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{d.domain}</span>
                    <span className="text-muted-foreground text-xs">{(d.requests / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${(d.requests / topDomains[0].requests) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate & Latency Trends */}
      <Card variant="default">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Success Rate & Latency Trends</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => exportPNG("chart-trends")} aria-label="Export chart as PNG">
              <Image className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]" id="chart-trends">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(142, 71%, 45%)" fontSize={12} domain={[90, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(199, 89%, 48%)" fontSize={12} tickFormatter={(v) => `${v}ms`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="successRate" name="Success Rate" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="avgLatency" name="Avg Latency" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={false} />
                {anomalies.map((a, i) => (
                  <ReferenceDot key={`sr-${i}`} x={a.date} y={a.successRate} yAxisId="left" r={5} fill="hsl(0, 84%, 60%)" stroke="hsl(0, 84%, 60%)" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Proxy Type Distribution */}
      <Card variant="default">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-accent" />
            <CardTitle className="text-lg">Requests by Proxy Type</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={byProxyType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="percentage" nameKey="type">
                    {byProxyType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {byProxyType.map((item, i) => (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span>{item.type}</span>
                  </div>
                  <Badge variant="muted">{item.percentage}%</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
