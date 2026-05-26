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
  Cable,
  ShieldCheck,
  Activity,
  Key,
  Settings2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  FileCode,
  Zap,
  Globe,
  Database,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Dynamic imports for charting to reduce TBT
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);

// Import recharts components directly to avoid type issues with dynamic imports
import { Area, XAxis, YAxis, Tooltip } from "recharts";

const performanceData = [
  { time: "00:00", latency: 42, error: 0 },
  { time: "04:00", latency: 38, error: 0.1 },
  { time: "08:00", latency: 120, error: 0.5 },
  { time: "12:00", latency: 85, error: 0.2 },
  { time: "16:00", latency: 45, error: 0 },
  { time: "20:00", latency: 52, error: 0 },
  { time: "23:59", latency: 40, error: 0 },
];

export default function AdminIntegrationsPage() {
  const [activeTab, setActiveTab] = useState("catalog");

  const integrations = [
    {
      name: "Stripe Settlement",
      category: "PAYMENT",
      status: "ONLINE",
      health: 100,
      lastUsed: "2m ago",
      version: "v3.2",
    },
    {
      name: "Maersk Logistics",
      category: "LOGISTICS",
      status: "ONLINE",
      health: 98,
      lastUsed: "15m ago",
      version: "v1.4",
    },
    {
      name: "Gemini AI Verification",
      category: "AI",
      status: "ONLINE",
      health: 100,
      lastUsed: "5m ago",
      version: "v2.5",
    },
    {
      name: "LME Spot Index",
      category: "MARKET_DATA",
      status: "DEGRADED",
      health: 72,
      lastUsed: "1h ago",
      version: "v1.0",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Cable className="h-8 w-8 text-primary" />
            API & Integrations
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Manage platform middleware, third-party services, and developer
            access.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <Key className="h-4 w-4" /> Rotate Master Keys
          </Button>
          <Button className="bg-primary text-white font-bold gap-2 shadow-lg h-12 px-8">
            <Plus className="h-4 w-4" /> Register Integration
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          {
            label: "Active Integrations",
            val: "12",
            icon: Zap,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "System Health",
            val: "99.2%",
            icon: Activity,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "API Requests (24h)",
            val: "1.4M",
            icon: FileCode,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            label: "Critical Failures",
            val: "00",
            icon: AlertCircle,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {stat.val}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs
        defaultValue="catalog"
        className="space-y-6"
        onValueChange={setActiveTab}
      >
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="catalog" className="px-8 font-bold">
            Service Catalog
          </TabsTrigger>
          <TabsTrigger value="security" className="px-8 font-bold">
            Security & Keys
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="px-8 font-bold">
            Real-time Telemetry
          </TabsTrigger>
          <TabsTrigger value="docs" className="px-8 font-bold">
            Developer SDKs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search services (e.g. Stripe)..."
                    className="pl-10 h-10 border-slate-200 focus-visible:ring-primary/20"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-10 border-slate-200"
                >
                  <Filter className="h-4 w-4" /> All Categories
                </Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Service Name</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Health</TableHead>
                  <TableHead className="font-bold">Version</TableHead>
                  <TableHead className="text-right font-bold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((item, idx) => (
                  <TableRow
                    key={idx}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                          Last call: {item.lastUsed}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold"
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-[9px] font-bold px-2 py-0",
                          item.status === "ONLINE"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              item.health > 90
                                ? "bg-emerald-500"
                                : item.health > 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            )}
                            style={{ width: `${item.health}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {item.health}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-400">
                      {item.version}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary font-bold gap-2"
                      >
                        Configure <Settings2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg">Network Latency (ms)</CardTitle>
                <CardDescription>
                  Aggregate response times across global platform nodes.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient
                        id="colorLatency"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
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
                      dataKey="time"
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
                      dataKey="latency"
                      stroke="#1B4498"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorLatency)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute right-0 top-0 p-8 opacity-10">
                  <Globe className="h-48 w-48" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Infrastructure Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Database Persistence
                      </span>
                      <span className="font-bold text-emerald-400">99.99%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Webhook Success Rate
                      </span>
                      <span className="font-bold text-emerald-400">99.2%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Auth Token Rotation
                      </span>
                      <span className="font-bold text-secondary">Secured</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg">
                    Full System Diagnostics
                  </Button>
                </CardContent>
              </Card>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase">
                    Latency Warning
                  </p>
                  <p className="text-xs text-amber-600 leading-relaxed mt-1">
                    Increased latency detected on Rotterdam logistics gateway
                    (v1.2). Automated failover to secondary node active.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-rose-600" />
                  Partner Access Keys
                </CardTitle>
                <CardDescription>
                  Issued API keys for external trade partners and carriers.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Key Alias</TableHead>
                      <TableHead className="font-bold">Partner</TableHead>
                      <TableHead className="font-bold">Scopes</TableHead>
                      <TableHead className="text-right font-bold">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        alias: "Prod_Shipment_Key",
                        partner: "DHL Global",
                        scope: "SHIPMENT_READ, ORDER_WRITE",
                      },
                      {
                        alias: "Finance_Settlement",
                        partner: "LC Trust Bank",
                        scope: "ESCROW_RELEASE",
                      },
                    ].map((k, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {k.alias}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {k.partner}
                        </TableCell>
                        <TableCell className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {k.scope}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-500"
                          >
                            <Loader2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  API Policy Guard
                </CardTitle>
                <CardDescription>
                  Global security and rate limiting rules.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold">Global Throttling</p>
                      <p className="text-[10px] text-slate-500">
                        Maximum requests per minute per IP.
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      1,000 / min
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold">Enforce TLS 1.3</p>
                      <p className="text-[10px] text-slate-500">
                        Reject connections using older TLS protocols.
                      </p>
                    </div>
                    <Badge className="bg-emerald-500">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold">Payload Sanitization</p>
                      <p className="text-[10px] text-slate-500">
                        AI-powered scanning for SQL injection in API calls.
                      </p>
                    </div>
                    <Badge className="bg-emerald-500">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
