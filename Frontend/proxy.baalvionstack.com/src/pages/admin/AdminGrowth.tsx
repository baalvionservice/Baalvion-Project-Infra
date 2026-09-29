import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Gift, DollarSign, Target } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAdminDashboard } from "@/hooks/useAdmin";

const conversionRates = { visitToSignup: 4.2, signupToTrial: 68.5, trialToPaid: 32.1 };
const affiliateReferrals = [
  { id: 1, name: "Rahul Sharma", referrals: 48, conversionRate: 31, revenue: 14400 },
  { id: 2, name: "Sophie Chen", referrals: 35, conversionRate: 28, revenue: 9800 },
  { id: 3, name: "Mark Williams", referrals: 22, conversionRate: 36, revenue: 7920 },
];
const promoCodePerformance = [
  { code: "LAUNCH50", uses: 142, discount: 50, revenue: 6390, status: "expired" },
  { code: "GROW20", uses: 87, discount: 20, revenue: 8352, status: "active" },
  { code: "PROXY10", uses: 54, discount: 10, revenue: 3240, status: "active" },
];
const revenueByChannel = [
  { channel: "Direct", revenue: 94700, percentage: 50 },
  { channel: "Affiliate", revenue: 37880, percentage: 20 },
  { channel: "SEO", revenue: 28410, percentage: 15 },
  { channel: "Paid Ads", revenue: 18940, percentage: 10 },
  { channel: "Referral", revenue: 9470, percentage: 5 },
];
const cacData = { current: 42, trend: [
  { month: "Nov", cac: 58 }, { month: "Dec", cac: 53 }, { month: "Jan", cac: 50 },
  { month: "Feb", cac: 47 }, { month: "Mar", cac: 44 }, { month: "Apr", cac: 42 },
]};
const ltvData = { current: 8420, ltvCacRatio: 200, trend: [
  { month: "Nov", ltv: 6800 }, { month: "Dec", ltv: 7100 }, { month: "Jan", ltv: 7400 },
  { month: "Feb", ltv: 7800 }, { month: "Mar", ltv: 8100 }, { month: "Apr", ltv: 8420 },
]};
const CHANNEL_COLORS = ["hsl(199,89%,48%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(280,67%,55%)", "hsl(0,84%,60%)"];

export default function AdminGrowth() {
  const { data: dash } = useAdminDashboard();
  const totalUsers = dash?.totalUsers ?? 5000;

  const funnelData = [
    { stage: "Website Visitors", count: totalUsers * 38, percentage: 100 },
    { stage: "Signed Up", count: totalUsers * 4, percentage: Math.round((totalUsers * 4 / (totalUsers * 38)) * 100) },
    { stage: "Trial Started", count: Math.round(totalUsers * 2.7), percentage: Math.round((totalUsers * 2.7 / (totalUsers * 38)) * 100) },
    { stage: "Paid Conversion", count: totalUsers, percentage: Math.round((totalUsers / (totalUsers * 38)) * 100) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Growth Engine</h1>
        <p className="text-muted-foreground mt-1">Acquisition, conversion & revenue intelligence</p>
      </div>

      {/* Funnel */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Signup → Paid Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((step, i) => (
              <div key={step.stage} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{step.stage}</span>
                  <span className="text-sm text-muted-foreground">{step.count.toLocaleString()} ({step.percentage}%)</span>
                </div>
                <div className="h-8 bg-secondary/30 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-1000 ease-out"
                    style={{
                      width: `${step.percentage}%`,
                      background: `linear-gradient(90deg, hsl(199,89%,48%) 0%, hsl(${199 - i * 30},${89 - i * 5}%,${48 - i * 5}%) 100%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(conversionRates).filter(([k]) => k !== "overallConversion").map(([key, val]) => (
              <Badge key={key} variant="outline" className="text-xs">{key.replace(/([A-Z])/g, " $1").trim()}: {val}%</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CAC & LTV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Customer Acquisition Cost</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3"><span className="text-2xl font-bold text-foreground">${cacData.current}</span><span className="text-sm text-success ml-2">↓ trending down</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cacData.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,16%)" />
                <XAxis dataKey="month" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} />
                <Line type="monotone" dataKey="cac" stroke="hsl(199,89%,48%)" strokeWidth={2} dot={{ fill: "hsl(199,89%,48%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-success" />Lifetime Value</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3"><span className="text-2xl font-bold text-foreground">${ltvData.current}</span><span className="text-sm text-muted-foreground ml-2">LTV:CAC = {ltvData.ltvCacRatio}x</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ltvData.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,16%)" />
                <XAxis dataKey="month" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} />
                <Line type="monotone" dataKey="ltv" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={{ fill: "hsl(142,71%,45%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Channel */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Revenue by Channel</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={revenueByChannel} cx="50%" cy="50%" outerRadius={100} innerRadius={60} dataKey="revenue" nameKey="channel" label={({ channel, percentage }) => `${channel} ${percentage}%`}>
                {revenueByChannel.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} formatter={(v: number) => `$${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Affiliates & Promos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Affiliate Referrals</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {affiliateReferrals.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div><p className="text-sm font-medium text-foreground">{a.name}</p><p className="text-xs text-muted-foreground">{a.referrals} referrals · {a.conversionRate}% CR</p></div>
                  <span className="text-sm font-medium text-success">${a.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gift className="w-4 h-4 text-warning" />Promo Code Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {promoCodePerformance.map((p) => (
                <div key={p.code} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div><p className="text-sm font-mono font-medium text-foreground">{p.code}</p><p className="text-xs text-muted-foreground">{p.uses} uses · {p.discount}% off</p></div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">${p.revenue.toLocaleString()}</p>
                    <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
