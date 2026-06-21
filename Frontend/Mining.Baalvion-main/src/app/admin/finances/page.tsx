"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DollarSign,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Landmark,
  CreditCard,
  History,
  FileText,
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
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), {
  ssr: false,
});

// Import recharts components directly to avoid type issues with dynamic imports
import { Area, XAxis, YAxis, Tooltip, Pie, Cell } from "recharts";

const revenueData = [
  { name: "Mon", revenue: 42000, commission: 8400 },
  { name: "Tue", revenue: 38000, commission: 7600 },
  { name: "Wed", revenue: 52000, commission: 10400 },
  { name: "Thu", revenue: 48000, commission: 9600 },
  { name: "Fri", revenue: 61000, commission: 12200 },
  { name: "Sat", revenue: 35000, commission: 7000 },
  { name: "Sun", revenue: 29000, commission: 5800 },
];

const channelData = [
  { name: "Trade Commissions", value: 65, color: "#1B4498" },
  { name: "Ad Revenue", value: 20, color: "#21CEDD" },
  { name: "Service Fees", value: 15, color: "#64748b" },
];

export default function AdminFinanceDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            Global Finance Command
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Platform-wide financial auditing, escrow oversight, and revenue
            metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 px-6 font-bold border-slate-300"
          >
            <History className="h-4 w-4 mr-2" /> Audit Ledger
          </Button>
          <Button className="bg-primary text-white h-12 px-8 font-bold shadow-lg shadow-primary/20">
            <FileText className="h-4 w-4 mr-2" /> Export Quarterly Report
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Platform GMV",
            val: "$142.8M",
            change: "+12.4%",
            isUp: true,
            icon: Activity,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Commission Revenue",
            val: "$3.57M",
            change: "+18.2%",
            isUp: true,
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Secured Escrow",
            val: "$24.2M",
            change: "Verified",
            isUp: true,
            icon: ShieldCheck,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            label: "Daily Transactions",
            val: "1,242",
            change: "-2.1%",
            isUp: false,
            icon: CreditCard,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm hover:shadow-md transition-shadow group"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    stat.isUp
                      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                      : "border-rose-200 text-rose-700 bg-rose-50"
                  )}
                >
                  {stat.isUp ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
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

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Revenue Stream Analysis</CardTitle>
              <CardDescription>
                Consolidated platform income (Last 7 Days).
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white border-slate-200">
                GMV
              </Badge>
              <Badge variant="outline" className="bg-white border-slate-200">
                Net Commission
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1B4498"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="#21CEDD"
                  strokeWidth={3}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Monetization Mix</CardTitle>
            <CardDescription>Revenue contribution by channel.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {channelData.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between text-xs font-bold uppercase tracking-tight"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-slate-500">{c.name}</span>
                  </div>
                  <span className="text-slate-900">{c.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-lg">Critical Escrow Monitoring</CardTitle>
          <CardDescription>
            High-value transactions requiring milestone verification.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">TXN ID</TableHead>
              <TableHead className="font-bold">
                Parties (Seller → Buyer)
              </TableHead>
              <TableHead className="font-bold">Amount</TableHead>
              <TableHead className="font-bold">Escrow Status</TableHead>
              <TableHead className="font-bold">Commission</TableHead>
              <TableHead className="text-right font-bold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              {
                id: "TXN-8821",
                seller: "Atlas Mining",
                buyer: "China Const",
                val: "$525,000",
                status: "FUNDED",
                fee: "$13,125",
              },
              {
                id: "TXN-8819",
                seller: "Zambia Copper",
                buyer: "Global Metals",
                val: "$1.2M",
                status: "SHIPPING",
                fee: "$30,000",
              },
              {
                id: "TXN-8815",
                seller: "Blue Ridge",
                buyer: "India Infra",
                val: "$85,000",
                status: "DISPUTED",
                fee: "$2,125",
              },
            ].map((txn) => (
              <TableRow
                key={txn.id}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <TableCell className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-primary">
                  {txn.id}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-xs">
                      {txn.seller} → {txn.buyer}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                      Industrial Trade
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-slate-900">
                  {txn.val}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "text-[9px] font-bold tracking-widest",
                      txn.status === "FUNDED"
                        ? "bg-emerald-100 text-emerald-700"
                        : txn.status === "DISPUTED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {txn.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium text-emerald-600 font-bold">
                  {txn.fee}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary font-bold text-[10px] uppercase"
                  >
                    Review TXN
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
