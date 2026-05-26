"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FileDown,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Activity,
  Scan,
  RefreshCcw,
  Loader2,
  Globe,
  Search,
  MousePointer2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Dynamic import for Recharts to reduce initial bundle size and improve FID
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), {
  ssr: false,
});
const AreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false }
);

// Import recharts components directly to avoid type issues with dynamic imports
import { Bar, XAxis, YAxis, Tooltip, Pie, Cell, Area } from "recharts";

const tradeData = [
  { name: "Jan", revenue: 4000, volume: 2400, inquiries: 1200 },
  { name: "Feb", revenue: 3000, volume: 1398, inquiries: 1100 },
  { name: "Mar", revenue: 2000, volume: 9800, inquiries: 2400 },
  { name: "Apr", revenue: 2780, volume: 3908, inquiries: 1800 },
  { name: "May", revenue: 1890, volume: 4800, inquiries: 1500 },
  { name: "Jun", revenue: 3200, volume: 5200, inquiries: 2100 },
];

const trafficData = [
  { date: "Mon", organic: 1200, direct: 400, referral: 300 },
  { date: "Tue", organic: 1500, direct: 450, referral: 350 },
  { date: "Wed", organic: 1100, direct: 380, referral: 280 },
  { date: "Thu", organic: 1800, direct: 520, referral: 420 },
  { date: "Fri", organic: 2200, direct: 600, referral: 500 },
  { date: "Sat", organic: 1400, direct: 350, referral: 250 },
  { date: "Sun", organic: 1600, direct: 420, referral: 320 },
];

const COLORS = ["#1B4498", "#21CEDD", "#64748b", "#94a3b8"];

const stageDistributionData = [
  { name: "Stage 0", value: 25 },
  { name: "Stage 1", value: 40 },
  { name: "Stage 2", value: 20 },
  { name: "Stage 3", value: 15 },
];

const materialDemandData = [
  { name: "Iron Ore", value: 45 },
  { name: "Lithium", value: 25 },
  { name: "Copper", value: 20 },
  { name: "Granite", value: 10 },
];

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleExport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "BI Dispatch",
        description: "Executive summary PDF generated and delivered.",
      });
    }, 2000);
  };

  const runSystemScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Infrastructure Verified",
        description: "Global trade nodes are healthy and synchronized.",
      });
    }, 3000);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Executive Intelligence Hub
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Cross-module operational visibility, lead stage analytics, and
            platform yield governance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 border-slate-300 h-12 px-6"
            onClick={runSystemScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <RefreshCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Scan className="h-4 w-4" />
            )}
            {isScanning ? "Scanning Matrix..." : "Verify Integrity"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 h-12 px-8 shadow-lg"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export Quarterly BI
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Annual Lead Profile",
            val: "14,842",
            change: "+22.4%",
            icon: FileDown,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Conversion Yield",
            val: "24.2%",
            change: "+5.2%",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Automation Health",
            val: "99.2%",
            change: "Optimal",
            icon: Activity,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            label: "Compliance Index",
            val: "98/100",
            change: "Verified",
            icon: ShieldCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm group hover:shadow-md transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    stat.bg,
                    stat.color
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  {stat.change}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 group-hover:text-primary transition-colors">
                {stat.val}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="leads" className="space-y-8">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="leads" className="px-8 font-bold">
            Partnership Pipeline
          </TabsTrigger>
          <TabsTrigger value="traffic" className="px-8 font-bold">
            Platform Traffic
          </TabsTrigger>
          <TabsTrigger value="market" className="px-8 font-bold">
            Market Demand
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="px-8 font-bold">
            Risk Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pipeline Velocity</CardTitle>
                  <CardDescription>
                    Correlation between incoming inquiries and stage mapping.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-white border-slate-200">
                  Current Quarter
                </Badge>
              </CardHeader>
              <CardContent className="h-[400px] pt-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tradeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="inquiries"
                      fill="#1B4498"
                      radius={[4, 4, 0, 0]}
                      name="Inquiries"
                    />
                    <Bar
                      dataKey="volume"
                      fill="#21CEDD"
                      radius={[4, 4, 0, 0]}
                      name="Stage Transitions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Trade Stage Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of leads by industrial stage.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageDistributionData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stageDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 mt-4">
                  {stageDistributionData.map((s, i) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: COLORS[i] }}
                        />
                        <span className="text-slate-500">{s.name}</span>
                      </div>
                      <span className="text-slate-900">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg">Acquisition Trends</CardTitle>
                <CardDescription>
                  Daily visitor volume by source (GA4 Synchronized).
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] pt-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <defs>
                      <linearGradient id="colorOrg" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#1B4498"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1B4498"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="organic"
                      stroke="#1B4498"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorOrg)"
                      name="Organic Search"
                    />
                    <Area
                      type="monotone"
                      dataKey="direct"
                      stroke="#21CEDD"
                      strokeWidth={3}
                      fillOpacity={0}
                      name="Direct Traffic"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    SEO Indexing Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Indexed Pages
                      </span>
                      <span className="text-lg font-bold text-emerald-400">
                        1,242
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-xs text-slate-400">
                        Excluded (No-index)
                      </span>
                      <span className="text-lg font-bold">142</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-xs text-slate-400">
                        Crawl Errors
                      </span>
                      <span className="text-lg font-bold text-rose-400">0</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 border-none shadow-lg">
                    Check Search Console
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                  <CardTitle className="text-sm font-bold">
                    Top Search Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {[
                      {
                        key: "lithium spodumene grade",
                        clicks: 420,
                        ctr: "12.4%",
                      },
                      { key: "iron ore fine 62% fe", clicks: 310, ctr: "8.2%" },
                      {
                        key: "mineral trade compliance",
                        clicks: 180,
                        ctr: "5.1%",
                      },
                    ].map((k, i) => (
                      <div
                        key={i}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-default"
                      >
                        <span className="text-xs font-medium text-slate-700">
                          {k.key}
                        </span>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-primary">
                            {k.clicks} clicks
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            {k.ctr} CTR
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Material Interest Trends
                </CardTitle>
                <CardDescription>
                  Mineral demand captured via intake survey.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialDemandData}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={10}
                      dataKey="value"
                    >
                      {materialDemandData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {materialDemandData.map((m, i) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: COLORS[i] }}
                        />
                        <span className="text-xs font-bold text-slate-600 uppercase">
                          {m.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {m.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute right-0 top-0 p-8 opacity-10">
                <Globe className="h-48 w-48" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Regional Hotspots</CardTitle>
                <CardDescription className="text-slate-400">
                  Where the highest-scoring leads are originating.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10 pt-4">
                {[
                  {
                    region: "Western Australia",
                    count: "142 Leads",
                    score: "88 Avg",
                  },
                  {
                    region: "South America",
                    count: "85 Leads",
                    score: "92 Avg",
                  },
                  { region: "West Africa", count: "64 Leads", score: "84 Avg" },
                ].map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{r.region}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">
                        {r.count}
                      </p>
                    </div>
                    <Badge className="bg-secondary text-primary font-black uppercase italic tracking-tighter">
                      {r.score}
                    </Badge>
                  </div>
                ))}
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg border-none mt-4">
                  Launch Regional Demand Map
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
