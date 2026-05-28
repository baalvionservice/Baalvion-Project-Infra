import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Users, UserCheck, Activity, MessageSquare, Heart, ThumbsUp,
  Briefcase, TrendingUp, Crown, DollarSign, Save, ShieldCheck
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

type Metrics = {
  totalUsers: number;
  approvedElite: number;
  pendingElite: number;
  activeUsers7d: number;
  totalDeals: number;
  activeDeals: number;
  topDeals: { name: string; orders: number; revenue: number }[];
  totalThreads: number;
  totalPosts: number;
  totalLikes: number;
  topUsers: { username: string; points: number }[];
  premiumCount: number;
  signupsByDay: { day: string; count: number }[];
};

const StatCard = ({ icon: Icon, label, value, hint }: any) => (
  <Card className="bg-gradient-to-br from-card to-card/60 border-primary/10 hover:border-primary/40 transition-all">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

const AdminAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [revenue, setRevenue] = useState<string>("0");
  const [savingRevenue, setSavingRevenue] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    })();
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    loadMetrics();
  }, [isAdmin]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [
        profilesRes, eliteAppsRes, activitiesRes,
        productsRes, ordersRes,
        threadsRes, postsRes, likesRes,
        topUsersRes, premiumRes, settingsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id, created_at", { count: "exact" }),
        supabase.from("elite_applications").select("status"),
        supabase.from("user_activities").select("user_id").gte("created_at", sevenDaysAgo),
        supabase.from("products").select("id, name, stock_quantity, is_featured"),
        supabase.from("orders").select("product_id, total_amount"),
        supabase.from("forum_threads").select("id", { count: "exact", head: true }),
        supabase.from("forum_posts").select("id", { count: "exact", head: true }),
        supabase.from("post_likes").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("username, points").order("points", { ascending: false }).limit(5),
        supabase.from("elite_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("app_settings").select("value").eq("key", "manual_revenue").maybeSingle(),
      ]);

      const apps = eliteAppsRes.data || [];
      const approvedElite = apps.filter(a => a.status === "approved").length;
      const pendingElite = apps.filter(a => a.status === "pending").length;

      const activeUsers7d = new Set((activitiesRes.data || []).map(a => a.user_id)).size;

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const orderMap = new Map<string, { orders: number; revenue: number }>();
      orders.forEach(o => {
        if (!o.product_id) return;
        const cur = orderMap.get(o.product_id) || { orders: 0, revenue: 0 };
        cur.orders += 1;
        cur.revenue += Number(o.total_amount || 0);
        orderMap.set(o.product_id, cur);
      });
      const topDeals = products
        .map(p => ({
          name: p.name,
          orders: orderMap.get(p.id)?.orders || 0,
          revenue: orderMap.get(p.id)?.revenue || 0,
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      // signups last 7 days
      const profiles = profilesRes.data || [];
      const days: { day: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("en-US", { weekday: "short" });
        const count = profiles.filter(p => (p.created_at || "").slice(0, 10) === key).length;
        days.push({ day: label, count });
      }

      setMetrics({
        totalUsers: profilesRes.count || profiles.length,
        approvedElite,
        pendingElite,
        activeUsers7d,
        totalDeals: products.length,
        activeDeals: products.filter(p => (p.stock_quantity ?? 0) > 0).length,
        topDeals,
        totalThreads: threadsRes.count || 0,
        totalPosts: postsRes.count || 0,
        totalLikes: likesRes.count || 0,
        topUsers: (topUsersRes.data || []).map(u => ({ username: u.username, points: u.points || 0 })),
        premiumCount: premiumRes.count || 0,
        signupsByDay: days,
      });

      const settingVal = (settingsRes.data?.value as any);
      if (settingVal?.amount !== undefined) setRevenue(String(settingVal.amount));
    } catch (e: any) {
      toast({ title: "Failed to load analytics", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveRevenue = async () => {
    setSavingRevenue(true);
    const amount = Number(revenue);
    if (Number.isNaN(amount)) {
      toast({ title: "Invalid amount", variant: "destructive" });
      setSavingRevenue(false);
      return;
    }
    const { data: existing } = await supabase
      .from("app_settings").select("id").eq("key", "manual_revenue").maybeSingle();
    const payload = { key: "manual_revenue", value: { amount, updated_at: new Date().toISOString() } };
    const res = existing
      ? await supabase.from("app_settings").update(payload).eq("id", existing.id)
      : await supabase.from("app_settings").insert(payload);
    if (res.error) toast({ title: "Save failed", description: res.error.message, variant: "destructive" });
    else toast({ title: "Revenue updated" });
    setSavingRevenue(false);
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md border-destructive/40">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">You don't have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-primary/40 text-primary">
                <ShieldCheck className="w-3 h-3 mr-1" /> Admin
              </Badge>
              <span className="text-xs text-muted-foreground">Internal Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Command Center</h1>
            <p className="text-sm text-muted-foreground">Real-time platform intelligence</p>
          </div>
          <Button variant="outline" onClick={loadMetrics} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {loading || !metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <>
            {/* USERS */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-primary/80 font-semibold mb-3">Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={metrics.totalUsers.toLocaleString()} />
                <StatCard icon={UserCheck} label="Approved Elite" value={metrics.approvedElite} hint="elite_applications" />
                <StatCard icon={Activity} label="Pending Applications" value={metrics.pendingElite} />
                <StatCard icon={TrendingUp} label="Active (7d)" value={metrics.activeUsers7d} />
              </div>
            </section>

            {/* CHARTS */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card border-primary/10">
                <CardHeader><CardTitle className="text-base">Signups · Last 7 Days</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.signupsByDay}>
                        <defs>
                          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(45 93% 58%)" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="hsl(45 93% 58%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Area type="monotone" dataKey="count" stroke="hsl(45 93% 58%)" strokeWidth={2} fill="url(#goldGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-primary/10">
                <CardHeader><CardTitle className="text-base">Top Members by Points</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {metrics.topUsers.length === 0 && <p className="text-sm text-muted-foreground">No users yet.</p>}
                  {metrics.topUsers.map((u, i) => (
                    <div key={u.username} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-semibold">{i+1}</span>
                        <span className="text-sm">{u.username}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{u.points.toLocaleString()}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* DEALS */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-primary/80 font-semibold mb-3">Deals</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <StatCard icon={Briefcase} label="Total Deals Posted" value={metrics.totalDeals} />
                <StatCard icon={TrendingUp} label="Active Deals" value={metrics.activeDeals} hint="in stock" />
                <StatCard icon={DollarSign} label="Total Order Volume" value={metrics.topDeals.reduce((a,b)=>a+b.orders,0)} />
              </div>
              <Card className="bg-card border-primary/10">
                <CardHeader><CardTitle className="text-base">Deals with Highest Investor Interest</CardTitle></CardHeader>
                <CardContent>
                  {metrics.topDeals.every(d => d.orders === 0) ? (
                    <p className="text-sm text-muted-foreground">No order activity yet.</p>
                  ) : (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.topDeals}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                          <Bar dataKey="orders" fill="hsl(45 93% 58%)" radius={[6,6,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* ENGAGEMENT */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-primary/80 font-semibold mb-3">Engagement</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={MessageSquare} label="Forum Threads" value={metrics.totalThreads.toLocaleString()} />
                <StatCard icon={MessageSquare} label="Total Posts" value={metrics.totalPosts.toLocaleString()} />
                <StatCard icon={Heart} label="Total Likes" value={metrics.totalLikes.toLocaleString()} />
                <StatCard icon={ThumbsUp} label="Avg Posts / Thread" value={metrics.totalThreads ? (metrics.totalPosts / metrics.totalThreads).toFixed(1) : "0"} />
              </div>
            </section>

            {/* REVENUE */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-primary/80 font-semibold mb-3">Revenue</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <StatCard icon={Crown} label="Active Premium Members" value={metrics.premiumCount} />
                <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" /> Manual Revenue Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Track revenue from external sources (off-platform deals, manual collections).
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={revenue}
                        onChange={(e) => setRevenue(e.target.value)}
                        placeholder="Enter amount"
                        className="bg-background"
                      />
                      <Button onClick={saveRevenue} disabled={savingRevenue} variant="default">
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
