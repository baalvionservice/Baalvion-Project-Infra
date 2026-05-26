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
  TrendingUp,
  Globe,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Gem,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Dynamic imports for charting to reduce initial bundle size and improve FID/TBT
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

const priceData = [
  { date: "2024-01", price: 98 },
  { date: "2024-02", price: 102 },
  { date: "2024-03", price: 105 },
  { date: "2024-04", price: 103 },
  { date: "2024-05", price: 108 },
  { date: "2024-06", price: 112 },
];

export default function MineralPriceDashboard() {
  const [selectedMineral, setSelectedMineral] = useState("Iron Ore");

  const topIndexes = [
    {
      name: "Iron Ore",
      price: "$112.40",
      change: "+4.2%",
      isUp: true,
      grade: "62% Fe",
    },
    {
      name: "Copper",
      price: "$9,420",
      change: "-1.8%",
      isUp: false,
      grade: "99.9% Purity",
    },
    {
      name: "Lithium",
      price: "$1,150",
      change: "+12.4%",
      isUp: true,
      grade: "SC 6.0",
    },
    {
      name: "Silica Sand",
      price: "$42.50",
      change: "0.0%",
      isUp: true,
      grade: "99% SiO2",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-secondary" />
            Global Mineral Price Index
          </h1>
          <p className="text-muted-foreground mt-1">
            Consolidated spot prices and market velocity indicators across
            global trade hubs.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Regional Filter
          </Button>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 font-bold shadow-sm">
            <Download className="h-4 w-4" /> Export Market Data
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topIndexes.map((idx, i) => (
          <Card
            key={i}
            className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
            onClick={() => setSelectedMineral(idx.name)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Gem className="h-5 w-5" />
                </div>
                <div
                  className={cn(
                    "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    idx.isUp
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  )}
                >
                  {idx.isUp ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {idx.change}
                </div>
              </div>
              <h3 className="font-bold text-slate-900">{idx.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">
                {idx.grade}
              </p>
              <p className="text-2xl font-bold text-primary">
                {idx.price}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  /MT
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Price Trend: {selectedMineral}
              </CardTitle>
              <CardDescription>
                Historical spot price performance (USD per MT).
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {["1W", "1M", "6M", "1Y"].map((t) => (
                <button
                  key={t}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-full transition-colors",
                    t === "6M"
                      ? "bg-primary text-white"
                      : "bg-white border text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[400px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4498" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1B4498" stopOpacity={0} />
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
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#1B4498"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-secondary" />
                Regional Variations
              </CardTitle>
              <CardDescription>Selected: {selectedMineral}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t">
                {[
                  { region: "Asia Pacific", price: "$114.20", spread: "+1.80" },
                  { region: "Europe", price: "$110.50", spread: "-1.90" },
                  { region: "North America", price: "$112.40", spread: "0.00" },
                  {
                    region: "South America",
                    price: "$108.90",
                    spread: "-3.50",
                  },
                ].map((r, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-600">
                      {r.region}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {r.price}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          r.spread.startsWith("+")
                            ? "text-emerald-600"
                            : r.spread === "0.00"
                            ? "text-slate-400"
                            : "text-rose-600"
                        )}
                      >
                        {r.spread} Spread
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity className="h-48 w-48" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Supply & Demand Signal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Active RFQs</span>
                  <span className="font-bold text-primary">142 Requests</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Bid Volume</span>
                  <span className="font-bold text-emerald-400">
                    $12.4M High
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Supplier Density</span>
                  <span className="font-bold text-amber-400">Medium-Low</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Market Sentiment
                </p>
                <p className="text-sm font-bold text-white">
                  BULLISH INDICATOR
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Decreased production from South American mines is driving
                  scarcity in 62% Fe Grade.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-lg">
            Fastest Rising Mineral Prices (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Mineral</TableHead>
              <TableHead className="font-bold">Region</TableHead>
              <TableHead className="font-bold">Monthly Change</TableHead>
              <TableHead className="font-bold">Current Spot</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              {
                name: "Cobalt Hydroxide",
                region: "Africa/Global",
                change: "+18.4%",
                price: "$12.50/lb",
              },
              {
                name: "Lithium Spodumene",
                region: "Australia",
                change: "+12.2%",
                price: "$1,150/MT",
              },
              {
                name: "Rare Earth Oxides",
                region: "Asia",
                change: "+9.5%",
                price: "$42,000/MT",
              },
            ].map((m, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-bold text-slate-900">
                  {m.name}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {m.region}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-bold text-emerald-600">
                    {m.change}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm font-bold">
                  {m.price}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-bold text-primary group"
                  >
                    Full Analysis{" "}
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
