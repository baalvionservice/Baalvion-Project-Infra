import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { DollarSign, TrendingUp, Users, AlertTriangle, BarChart3, PieChart } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart as RPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAdminRevenueSummary } from "@/hooks/useAdmin";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "hsl(var(--accent-foreground))"];

const mrrByMonth = [
  { month: "Nov", mrr: 142000, arr: 1704000 },
  { month: "Dec", mrr: 158000, arr: 1896000 },
  { month: "Jan", mrr: 163000, arr: 1956000 },
  { month: "Feb", mrr: 171000, arr: 2052000 },
  { month: "Mar", mrr: 180000, arr: 2160000 },
  { month: "Apr", mrr: 189400, arr: 2272800 },
];

const mrrByPlan = [
  { plan: "Starter", mrr: 18940 },
  { plan: "Growth", mrr: 56820 },
  { plan: "Enterprise", mrr: 113640 },
];

const gatewayDistribution = [
  { gateway: "Stripe", percentage: 55 },
  { gateway: "Razorpay", percentage: 30 },
  { gateway: "PayU", percentage: 15 },
];

const churnByMonth = [
  { month: "Nov", churnRate: 2.4, churned: 12 },
  { month: "Dec", churnRate: 2.1, churned: 11 },
  { month: "Jan", churnRate: 2.0, churned: 10 },
  { month: "Feb", churnRate: 1.9, churned: 10 },
  { month: "Mar", churnRate: 1.8, churned: 9 },
  { month: "Apr", churnRate: 1.8, churned: 9 },
];

export default function AdminRevenue() {
  const { data: rev } = useAdminRevenueSummary();
  const mrr = rev?.mrr ?? 0;
  const arr = rev?.arr ?? 0;
  const churnRate = rev?.churn ?? 0;
  const arpu = rev?.arpu ?? 0;
  const activeSubscriptions = mrr > 0 && arpu > 0 ? Math.round(mrr / arpu) : 0;
  const failedPaymentPercent = 3.2;

  return (
    <div className="space-y-6">
      <SEOHead title="Revenue Dashboard" description="Revenue analytics and projections" />
      <div>
        <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
        <p className="text-muted-foreground">MRR, ARR, churn, and gateway analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "MRR", value: `$${mrr.toLocaleString()}`, icon: DollarSign, delta: "+3.7%" },
          { label: "ARR", value: `$${arr.toLocaleString()}`, icon: TrendingUp, delta: "+12.4%" },
          { label: "Churn Rate", value: `${churnRate}%`, icon: AlertTriangle, delta: "-0.2%" },
          { label: "Active Subs", value: activeSubscriptions.toLocaleString(), icon: Users },
          { label: "ARPU", value: `$${arpu.toFixed(2)}`, icon: BarChart3 },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <k.icon className="w-5 h-5 text-primary" />
                {k.delta && <Badge variant={k.delta.startsWith("+") ? "success" : "warning"} className="text-[10px]">{k.delta}</Badge>}
              </div>
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MRR Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">MRR & ARR Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mrrByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Legend />
                <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} name="MRR" />
                <Line type="monotone" dataKey="arr" stroke="hsl(var(--success))" strokeWidth={2} name="ARR" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">MRR by Plan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mrrByPlan}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="plan" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="mrr" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gateway Distribution & Churn */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-4 h-4" /> Gateway Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RPie>
                <Pie data={gatewayDistribution} dataKey="percentage" nameKey="gateway" cx="50%" cy="50%" outerRadius={100} label={({ gateway, percentage }) => `${gateway} ${percentage}%`}>
                  {gatewayDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
              </RPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Churn Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={churnByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="churnRate" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="Churn %" />
                <Bar dataKey="churned" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Churned Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Failed Payment Metric */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Failed Payment Rate</CardTitle>
          <CardDescription>{failedPaymentPercent}% of payment attempts failed this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${failedPaymentPercent}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
