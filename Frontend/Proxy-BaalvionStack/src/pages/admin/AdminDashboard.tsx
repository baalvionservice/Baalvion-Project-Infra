import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Zap,
  MessageSquare
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Link } from "react-router-dom";
import { CountryAlertsPanel } from "@/components/admin/CountryAlertsPanel";
import { IPPoolHealthSection } from "@/components/admin/IPPoolHealthSection";
import { useAdminDashboard, useAdminUsers, useAdminRevenueSummary, useAdminSystemMetrics, useAdminTicketsPreview } from "@/hooks/useAdmin";

const revenueData = [
  { month: "Jul", revenue: 320000 },
  { month: "Aug", revenue: 350000 },
  { month: "Sep", revenue: 380000 },
  { month: "Oct", revenue: 420000 },
  { month: "Nov", revenue: 445000 },
  { month: "Dec", revenue: 476537 },
];

const userGrowthData = [
  { month: "Jul", users: 3200 },
  { month: "Aug", users: 3650 },
  { month: "Sep", users: 4100 },
  { month: "Oct", users: 4580 },
  { month: "Nov", users: 4920 },
  { month: "Dec", users: 5303 },
];

export default function AdminDashboard() {
  const { data: dash } = useAdminDashboard();
  const { data: usersPage } = useAdminUsers({ page: 1, pageSize: 4 });
  const { data: revenue } = useAdminRevenueSummary();
  const { data: metrics } = useAdminSystemMetrics();
  const { data: tickets } = useAdminTicketsPreview();

  const statCards = [
    {
      title: "Total Users",
      value: (dash?.totalUsers ?? 0).toLocaleString(),
      change: "+12.3%",
      icon: Users,
      color: "primary",
    },
    {
      title: "Monthly Revenue",
      value: revenue?.mrr ? `$${(revenue.mrr / 1000).toFixed(1)}K` : "$0",
      change: "+8.2%",
      icon: DollarSign,
      color: "accent",
    },
    {
      title: "Active Providers",
      value: (dash?.providers ?? 0).toLocaleString(),
      change: "+5.8%",
      icon: Activity,
      color: "success",
    },
    {
      title: "Total Tenants",
      value: (dash?.totalTenants ?? 0).toLocaleString(),
      change: "+18.5%",
      icon: TrendingUp,
      color: "warning",
    },
  ];

  const recentTickets = tickets ?? [];
  const recentUsers = usersPage?.data ?? [];

  return (
    <div className="space-y-6">
      <SEOHead title="Admin Dashboard" description="Platform overview, key metrics, and administrative controls for Baalvion NetStack." />
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} variant="stats">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight className="w-4 h-4 text-success" />
                <span className="text-sm text-success">{stat.change}</span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="users" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={{ fill: "hsl(199, 89%, 48%)", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Support Tickets</CardTitle>
            <Link to="/admin/tickets" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tickets yet</p>
              ) : recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      ticket.priority === "urgent" ? "bg-destructive" :
                      ticket.priority === "high" ? "bg-warning" : "bg-primary"
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{ticket.userEmail ?? ticket.id}</p>
                    </div>
                  </div>
                  <Badge variant={ticket.status === "open" ? "warning" : ticket.status === "resolved" ? "success" : "muted"}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <Link to="/admin/users" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
              ) : recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.role === "platform_admin" ? "default" : user.role === "owner" ? "success" : "muted"}>
                      {user.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <CountryAlertsPanel maxAlerts={5} />
      <IPPoolHealthSection />

      <Card variant="default">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">{metrics?.rps ?? 0} rps</p>
              <p className="text-xs text-muted-foreground">Requests/sec</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                <Activity className="w-6 h-6 text-accent" />
              </div>
              <p className="text-2xl font-bold">{metrics?.cpu ?? 0}%</p>
              <p className="text-xs text-muted-foreground">CPU Usage</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-warning" />
              </div>
              <p className="text-2xl font-bold">{dash?.openIncidents ?? 0}</p>
              <p className="text-xs text-muted-foreground">Open Incidents</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
