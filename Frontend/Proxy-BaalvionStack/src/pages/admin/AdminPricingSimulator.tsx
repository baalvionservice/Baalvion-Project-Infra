import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function AdminPricingSimulator() {
  const [resPrice, setResPrice] = useState(4.5);
  const [mobPrice, setMobPrice] = useState(12);
  const [dcPrice, setDcPrice] = useState(1.0);

  const baseMRR = 441203;
  const resMRR = baseMRR * 0.42 * (resPrice / 4.5);
  const mobMRR = baseMRR * 0.35 * (mobPrice / 12);
  const dcMRR = baseMRR * 0.23 * (dcPrice / 1.0);
  const projectedMRR = resMRR + mobMRR + dcMRR;
  const mrrDelta = projectedMRR - baseMRR;
  const mrrDeltaPct = ((mrrDelta / baseMRR) * 100).toFixed(1);

  const churnSensitivity = resPrice > 5.5 || mobPrice > 15 ? 5.8 : resPrice > 5 || mobPrice > 14 ? 4.5 : 3.2;
  const margin = 100 - ((0.35 / resPrice) * 100 + (2.5 / mobPrice) * 100 + (0.15 / dcPrice) * 100) / 3;

  const forecastData = [
    { month: "Current", mrr: baseMRR },
    { month: "+1 Mo", mrr: projectedMRR * 0.98 },
    { month: "+2 Mo", mrr: projectedMRR * 1.02 },
    { month: "+3 Mo", mrr: projectedMRR * 1.05 },
    { month: "+6 Mo", mrr: projectedMRR * 1.12 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Pricing Simulator</h1>
        <p className="text-muted-foreground mt-1">Model pricing changes and forecast revenue impact</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Projected MRR</p>
            <p className="text-2xl font-bold mt-1">${Math.round(projectedMRR).toLocaleString()}</p>
            <p className={`text-xs mt-1 ${mrrDelta >= 0 ? "text-success" : "text-destructive"}`}>
              {mrrDelta >= 0 ? "↑" : "↓"} {mrrDeltaPct}% vs current
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">MRR Delta</p>
            <p className={`text-2xl font-bold mt-1 ${mrrDelta >= 0 ? "text-success" : "text-destructive"}`}>
              {mrrDelta >= 0 ? "+" : ""}${Math.round(mrrDelta).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Est. Churn Rate</p>
            <p className="text-2xl font-bold mt-1">{churnSensitivity}%</p>
            <p className={`text-xs mt-1 ${churnSensitivity > 4 ? "text-destructive" : "text-success"}`}>
              {churnSensitivity > 4 ? "↑ Elevated risk" : "↓ Healthy range"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Blended Margin</p>
            <p className="text-2xl font-bold mt-1">{margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Sliders */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: "Residential Price", value: resPrice, setValue: setResPrice, min: 2, max: 8, step: 0.25, unit: "/GB", current: 4.5 },
          { label: "Mobile Price", value: mobPrice, setValue: setMobPrice, min: 5, max: 20, step: 0.5, unit: "/GB", current: 12 },
          { label: "Datacenter Price", value: dcPrice, setValue: setDcPrice, min: 0.3, max: 3, step: 0.1, unit: "/GB", current: 1.0 },
        ].map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">{s.label}</p>
                <Badge variant={s.value === s.current ? "outline" : "default"} className="font-mono">
                  ${s.value.toFixed(2)}{s.unit}
                </Badge>
              </div>
              <Slider
                value={[s.value]}
                onValueChange={([v]) => s.setValue(v)}
                min={s.min}
                max={s.max}
                step={s.step}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${s.min.toFixed(2)}</span>
                <span className="text-primary">Current: ${s.current.toFixed(2)}</span>
                <span>${s.max.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forecast Chart */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Projected MRR Impact</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="priceForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(199,89%,48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => `$${Math.round(v).toLocaleString()}`} />
              <Area type="monotone" dataKey="mrr" stroke="hsl(199,89%,48%)" fill="url(#priceForecast)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Churn Warning */}
      {churnSensitivity > 4 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-sm">High Churn Risk</p>
              <p className="text-xs text-muted-foreground">
                Current pricing may cause elevated churn. Consider incremental increases or grandfather existing users.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}