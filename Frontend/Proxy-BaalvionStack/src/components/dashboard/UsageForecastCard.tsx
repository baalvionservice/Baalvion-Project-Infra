import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

const forecastData = [
  { day: "Mar 1", actual: 12, projected: 12 },
  { day: "Mar 5", actual: 28, projected: 27 },
  { day: "Mar 10", actual: 45, projected: 44 },
  { day: "Mar 15", actual: 61, projected: 60 },
  { day: "Mar 20", actual: null, projected: 78 },
  { day: "Mar 25", actual: null, projected: 93 },
  { day: "Mar 30", actual: null, projected: 108 },
];

const planLimit = 100; // GB
const currentUsage = 61;
const projectedTotal = 108;
const daysLeft = 27;
const overageRate = 2.5; // $/GB

export function UsageForecastCard() {
  const projectedOverage = Math.max(0, projectedTotal - planLimit);
  const overageCost = projectedOverage * overageRate;
  const usagePercent = (currentUsage / planLimit) * 100;
  const isOverageRisk = projectedTotal > planLimit;

  return (
    <Card variant={isOverageRisk ? "default" : "default"} className={isOverageRisk ? "border-warning/40" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Usage Forecast
          </CardTitle>
          {isOverageRisk && (
            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/30 gap-1">
              <AlertTriangle className="w-3 h-3" />
              Overage Projected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current usage bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Current: <span className="text-foreground font-medium">{currentUsage} GB</span> / {planLimit} GB</span>
            <span className="text-muted-foreground">{daysLeft} days left</span>
          </div>
          <Progress
            value={usagePercent}
            className="h-2"
          />
        </div>

        {/* Chart */}
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="fcastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(v: number | null) => v !== null ? [`${v} GB`] : ["-"]}
              />
              <ReferenceLine y={planLimit} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Plan Limit", position: "right", fill: "hsl(var(--destructive))", fontSize: 10 }} />
              <Area type="monotone" dataKey="actual" stroke="hsl(199, 89%, 48%)" fill="url(#fcastGrad)" strokeWidth={2} connectNulls={false} />
              <Area type="monotone" dataKey="projected" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1.5} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Overage warning */}
        {isOverageRisk && (
          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <p className="text-sm font-medium text-warning">Projected overage: {projectedOverage} GB (~${overageCost.toFixed(0)} at ${overageRate}/GB)</p>
            </div>
            <p className="text-xs text-muted-foreground">Based on your current usage rate, you'll exceed your plan limit before the billing cycle ends.</p>
            <Button variant="outline" size="sm" asChild className="mt-1">
              <Link to="/app/billing" className="gap-1">
                Upgrade Plan <ArrowUpRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
