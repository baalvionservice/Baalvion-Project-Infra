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
  Sparkles,
  Settings2,
  TrendingUp,
  Brain,
  Save,
  History,
  Target,
  Zap,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  { day: "Mon", ctr: 2.1, conv: 0.8 },
  { day: "Tue", ctr: 2.4, conv: 0.9 },
  { day: "Wed", ctr: 2.8, conv: 1.2 },
  { day: "Thu", ctr: 3.2, conv: 1.5 },
  { day: "Fri", ctr: 3.5, conv: 1.8 },
  { day: "Sat", ctr: 3.1, conv: 1.4 },
  { day: "Sun", ctr: 2.9, conv: 1.3 },
];

export default function AdminAIConfig() {
  const { toast } = useToast();
  const [weights, setWeights] = useState({
    technical: 40,
    geo: 20,
    behavior: 25,
    urgency: 15,
  });

  const handleSave = () => {
    toast({
      title: "Algorithm Updated",
      description: "Global AI recommendation weights have been synchronized.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Recommendation Tuning
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Manage algorithmic weights and monitor suggestion performance.
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-primary text-white font-bold gap-2 px-8 h-12 shadow-lg"
        >
          <Save className="h-4 w-4" /> Apply Global Weights
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weight Tuning */}
        <Card className="lg:col-span-1 border-none shadow-sm h-fit">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-secondary" />
              Weight Configuration
            </CardTitle>
            <CardDescription>
              Adjust the priority of variables in the scoring engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            {[
              {
                label: "Technical Grade Match",
                key: "technical",
                icon: Target,
              },
              { label: "Geographic Proximity", key: "geo", icon: History },
              {
                label: "User Behavioral History",
                key: "behavior",
                icon: TrendingUp,
              },
              { label: "Market Urgency (Recency)", key: "urgency", icon: Zap },
            ].map((param) => (
              <div key={param.key} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <param.icon className="h-4 w-4 text-slate-400" />
                    <Label className="font-bold text-slate-700">
                      {param.label}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-primary font-bold">
                    {weights[param.key as keyof typeof weights]}%
                  </Badge>
                </div>
                <Slider
                  defaultValue={[weights[param.key as keyof typeof weights]]}
                  max={100}
                  step={1}
                  onValueChange={(v) =>
                    setWeights({ ...weights, [param.key]: v[0] })
                  }
                />
              </div>
            ))}

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                Changes take effect across the platform within 15 minutes. High
                technical matching is recommended for industrial minerals.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Performance Visualization */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Algorithm Performance</CardTitle>
                <CardDescription>
                  Click-through and conversion rates from AI items.
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 uppercase text-[10px] font-bold"
              >
                Live Data
              </Badge>
            </CardHeader>
            <CardContent className="h-[400px] pt-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorCtr" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="day"
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
                    dataKey="ctr"
                    stroke="#1B4498"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCtr)"
                    name="CTR (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conv"
                    stroke="#21CEDD"
                    strokeWidth={3}
                    fillOpacity={0}
                    name="Conv Rate (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute right-0 top-0 p-8 opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Conversion Revenue
                </CardTitle>
                <h3 className="text-3xl font-bold mt-2 text-emerald-400">
                  $4.2M
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Attributed trade volume directly generated from AI suggestions
                  this month.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
                  Popular AI Path
                </CardTitle>
                <h3 className="text-xl font-bold mt-2 text-slate-900">
                  Iron Ore → Africa → Bids
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  +18% Lift in regional engagement
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
