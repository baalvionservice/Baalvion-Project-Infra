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
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Zap,
  Megaphone,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), {
  ssr: false,
});

// Import recharts components directly to avoid type issues with dynamic imports
import { Area, XAxis, YAxis, Tooltip, Pie, Cell } from "recharts";

const revenueData = [
  { month: "Jan", sub: 45000, fee: 82000, ad: 12000 },
  { month: "Feb", sub: 48000, fee: 75000, ad: 15000 },
  { month: "Mar", sub: 52000, fee: 98000, ad: 18000 },
  { month: "Apr", sub: 55000, fee: 115000, ad: 22000 },
  { month: "May", sub: 61000, fee: 142000, ad: 25000 },
];

const COLORS = ["#1B4498", "#21CEDD", "#64748b"];

export default function AdminMonetizationHub() {
  const [activePlans] = useState([
    { name: "Free", users: 2841, conversion: "-", price: "$0" },
    { name: "Standard", users: 1420, conversion: "12%", price: "$49/mo" },
    { name: "Premium", users: 582, conversion: "8%", price: "$199/mo" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-emerald-600" />
            Monetization Command
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Platform yield management, subscription tiers, and advertising
            revenue.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 border-slate-300 font-bold">
            <ShieldCheck className="h-4 w-4 mr-2" /> Audit Billing
          </Button>
          <Button className="bg-primary text-white h-12 px-8 font-bold shadow-lg shadow-primary/20">
            <Zap className="h-4 w-4 mr-2" /> Adjust Global Pricing
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Platform MRR",
            val: "$242.5k",
            change: "+14.2%",
            isUp: true,
            icon: CreditCard,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Trade Fees (MTD)",
            val: "$1.42M",
            change: "+22.1%",
            isUp: true,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Ad Revenue (MTD)",
            val: "$42.8k",
            change: "+5.4%",
            isUp: true,
            icon: Megaphone,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Churn Rate",
            val: "1.2%",
            change: "-0.4%",
            isUp: false,
            icon: Users,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm group hover:shadow-md transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
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
              <h3 className="text-2xl font-bold mt-1 text-slate-900">
                {stat.val}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="overview" className="px-8 font-bold">
            Revenue Overview
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="px-8 font-bold">
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="ads" className="px-8 font-bold">
            Ad Management
          </TabsTrigger>
          <TabsTrigger value="fees" className="px-8 font-bold">
            Fee Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Platform Income Stream
                  </CardTitle>
                  <CardDescription>
                    Subscription vs. Trade Fees vs. Ads (Last 5 Months).
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-white">
                    Total $1.8M
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[400px] pt-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="month"
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
                      dataKey="fee"
                      stackId="1"
                      stroke="#1B4498"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSub)"
                      name="Trade Fees"
                    />
                    <Area
                      type="monotone"
                      dataKey="sub"
                      stackId="1"
                      stroke="#21CEDD"
                      strokeWidth={3}
                      fillOpacity={0.5}
                      fill="#21CEDD"
                      name="Subscriptions"
                    />
                    <Area
                      type="monotone"
                      dataKey="ad"
                      stackId="1"
                      stroke="#64748b"
                      strokeWidth={3}
                      fillOpacity={0.2}
                      fill="#64748b"
                      name="Advertising"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Revenue Composition</CardTitle>
                <CardDescription>Share by stream.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Trade Fees", value: 65 },
                        { name: "Subscriptions", value: 25 },
                        { name: "Advertising", value: 10 },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 mt-4">
                  {["Trade Fees", "Subscriptions", "Ads"].map((label, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs font-bold uppercase"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: COLORS[i] }}
                        />
                        <span className="text-slate-500">{label}</span>
                      </div>
                      <span className="text-slate-900">{[65, 25, 10][i]}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {activePlans.map((plan) => (
              <Card
                key={plan.name}
                className="border-none shadow-sm overflow-hidden group"
              >
                <CardHeader className="bg-slate-50/50 border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge className="bg-primary">{plan.price}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Active Users
                      </p>
                      <p className="text-xl font-bold">{plan.users}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Conversion
                      </p>
                      <p className="text-xl font-bold text-emerald-600">
                        {plan.conversion}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full font-bold group-hover:bg-primary group-hover:text-white transition-colors"
                  >
                    Edit Plan Features
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Global Fee Matrix</CardTitle>
              <CardDescription>
                Adjust commission rates based on user subscription tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-12">
                {[
                  { tier: "Free Tier Rate", default: 5.0, icon: Users },
                  {
                    tier: "Standard Tier Rate",
                    default: 3.5,
                    icon: ShieldCheck,
                  },
                  { tier: "Premium Tier Rate", default: 2.0, icon: Zap },
                ].map((f, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <f.icon className="h-4 w-4 text-primary" />
                      <Label className="font-bold text-slate-700">
                        {f.tier}
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        defaultValue={f.default}
                        className="pl-10 font-bold h-12 text-lg"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        %
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Effective for all new trades after save.
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-12 pt-8 border-t flex justify-between items-center">
                <p className="text-xs text-slate-500 max-w-lg">
                  <strong>Warning:</strong> Changes to fee rates will trigger a
                  system-wide notification to all registered businesses. History
                  of changes is stored in the Audit Log.
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-12 shadow-lg">
                  Save Fee Structure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
