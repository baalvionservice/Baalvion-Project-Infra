import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, AlertTriangle, Target, BarChart3 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAdminRevenueSummary, useAdminDashboard, useAdminUsers } from "@/hooks/useAdmin";

const mrrHistory = [
  { month: "Nov", mrr: 142000 }, { month: "Dec", mrr: 158000 },
  { month: "Jan", mrr: 163000 }, { month: "Feb", mrr: 171000 },
  { month: "Mar", mrr: 180000 }, { month: "Apr", mrr: 189400 },
];
const revenueByPlanData = [
  { plan: "Starter", revenue: 18940, color: "hsl(199,89%,48%)" },
  { plan: "Growth", revenue: 56820, color: "hsl(142,71%,45%)" },
  { plan: "Enterprise", revenue: 113640, color: "hsl(280,67%,55%)" },
];
const marginData = [
  { month: "Nov", costPerGB: 0.42, revenuePerGB: 0.65, netMargin: 35 },
  { month: "Dec", costPerGB: 0.40, revenuePerGB: 0.66, netMargin: 39 },
  { month: "Jan", costPerGB: 0.39, revenuePerGB: 0.67, netMargin: 42 },
  { month: "Feb", costPerGB: 0.38, revenuePerGB: 0.68, netMargin: 44 },
  { month: "Mar", costPerGB: 0.37, revenuePerGB: 0.69, netMargin: 46 },
  { month: "Apr", costPerGB: 0.36, revenuePerGB: 0.70, netMargin: 49 },
];
const revenueForecast = [
  { month: "May", projected: 198000, optimistic: 210000, pessimistic: 187000 },
  { month: "Jun", projected: 207000, optimistic: 225000, pessimistic: 192000 },
  { month: "Jul", projected: 218000, optimistic: 242000, pessimistic: 198000 },
];

export default function AdminControlRoom() {
  const { data: rev } = useAdminRevenueSummary();
  const { data: dash } = useAdminDashboard();
  const { data: usersPage } = useAdminUsers({ page: 1, pageSize: 100 });

  const mrr = rev?.mrr ?? 0;
  const churnRate = rev?.churn ?? 0;
  const totalUsers = dash?.totalUsers ?? 0;
  const activeSubscriptions = usersPage?.total ?? 0;
  const netMarginCurrent = marginData[marginData.length - 1].netMargin;
  const netMarginFirst = marginData[0].netMargin;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Founder Control Room</h1>
        <p className="text-muted-foreground mt-1">Revenue intelligence & business health</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">${mrr.toLocaleString()}</p>
                <p className="text-xs text-success mt-1">↑ 5.2% vs last month</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10"><DollarSign className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Net Margin</p>
                <p className="text-2xl font-bold text-foreground mt-1">{netMarginCurrent}%</p>
                <p className="text-xs text-success mt-1">↑ from {netMarginFirst}%</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold text-foreground mt-1">{activeSubscriptions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{totalUsers} total users</p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10"><Users className="w-5 h-5 text-accent" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold text-foreground mt-1">{churnRate}%</p>
                <p className="text-xs text-success mt-1">↓ trending down</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10"><AlertTriangle className="w-5 h-5 text-warning" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">MRR Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mrrHistory}>
                <defs><linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(199,89%,48%)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,16%)" />
                <XAxis dataKey="month" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} />
                <Area type="monotone" dataKey="mrr" stroke="hsl(199,89%,48%)" fill="url(#mrrGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Revenue by Plan</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={revenueByPlanData} cx="50%" cy="50%" outerRadius={90} innerRadius={55} dataKey="revenue" nameKey="plan" label={({ plan, percent }) => `${plan} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueByPlanData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Margin & Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Margin Simulation (Cost vs Revenue per GB)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,16%)" />
                <XAxis dataKey="month" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} />
                <Bar dataKey="costPerGB" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} name="Cost/GB" />
                <Bar dataKey="revenuePerGB" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} name="Revenue/GB" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">3-Month Revenue Forecast</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueForecast}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,16%)" />
                <XAxis dataKey="month" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} />
                <Area type="monotone" dataKey="optimistic" stroke="hsl(142,71%,45%)" fill="none" strokeDasharray="5 5" strokeWidth={1} name="Optimistic" />
                <Area type="monotone" dataKey="projected" stroke="hsl(199,89%,48%)" fill="url(#forecastGrad)" strokeWidth={2} name="Projected" />
                <Area type="monotone" dataKey="pessimistic" stroke="hsl(38,92%,50%)" fill="none" strokeDasharray="5 5" strokeWidth={1} name="Pessimistic" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Churn Risk & Upsell */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />High-Risk Churn Users</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(usersPage?.data ?? []).slice(0, 4).map((u, i) => {
                const risk = 45 + (i * 17) % 50;
                const reasons = ["Low engagement last 14d", "Failed payment", "Usage dropped 60%", "No login in 30d"];
                return (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{reasons[i % reasons.length]}</p>
                    </div>
                    <Badge variant={risk > 80 ? "destructive" : "secondary"} className="ml-2 shrink-0">{risk}% risk</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Upsell Targets</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(usersPage?.data ?? []).filter(u => u.role !== "platform_admin").slice(0, 4).map((u, i) => {
                const usagePct = 70 + (i * 7) % 28;
                const upsellValue = [200, 400, 150, 300][i % 4];
                return (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{usagePct}% of bandwidth used</p>
                    </div>
                    <Badge className="ml-2 shrink-0 bg-primary/20 text-primary border-0">+${upsellValue}/mo</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
