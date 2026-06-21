import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, DollarSign, Globe, TrendingUp,
  Shield, BarChart3, Activity,
  ChevronRight, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { protocolApi } from "@/lib/protocol-api";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// Mock data
const stats = [
  { 
    title: "Total Experts", 
    value: "247", 
    change: "+12%", 
    trend: "up",
    icon: Shield,
    route: "/protocol/admin/experts"
  },
  { 
    title: "Total Users", 
    value: "12,847", 
    change: "+23%", 
    trend: "up",
    icon: Users,
    route: "/protocol/admin/users"
  },
  { 
    title: "Platform Revenue", 
    value: "$892,450", 
    change: "+18%", 
    trend: "up",
    icon: DollarSign,
    route: "/protocol/admin/revenue"
  },
  { 
    title: "Active Countries", 
    value: "34", 
    change: "+3", 
    trend: "up",
    icon: Globe,
    route: "/protocol/admin/countries"
  }
];

const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 61000 },
  { month: "Apr", revenue: 58000 },
  { month: "May", revenue: 72000 },
  { month: "Jun", revenue: 85000 },
  { month: "Jul", revenue: 92000 },
];

const expertsByCountry = [
  { country: "India", experts: 78, color: "#f59e0b" },
  { country: "Pakistan", experts: 45, color: "#10b981" },
  { country: "USA", experts: 42, color: "#3b82f6" },
  { country: "UK", experts: 38, color: "#8b5cf6" },
  { country: "UAE", experts: 28, color: "#ef4444" },
  { country: "Others", experts: 16, color: "#6b7280" },
];

const recentActivity = [
  { action: "New Expert Approved", name: "Dr. Sarah Chen", time: "2 min ago", type: "success" },
  { action: "Subscription Upgrade", name: "Marcus Webb", time: "15 min ago", type: "info" },
  { action: "Expert Suspended", name: "John Doe", time: "1 hour ago", type: "warning" },
  { action: "New Country Added", name: "Singapore", time: "3 hours ago", type: "success" },
  { action: "Revenue Milestone", name: "$900K reached", time: "5 hours ago", type: "info" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [live, setLive] = useState({ experts: 0, users: 0, revenue: 0, countries: 0 });
  useEffect(() => {
    Promise.all([protocolApi.experts.list(), protocolApi.students.list(), protocolApi.countries.list()]).then(([experts, students, countries]) => {
      setLive({
        experts: experts.length,
        users: students.length + experts.length,
        revenue: experts.reduce((a: number, e: any) => a + (e.revenue || 0), 0),
        countries: countries.length,
      });
    });
  }, []);
  const stats = [
    { title: "Total Experts", value: String(live.experts), change: "+12%", trend: "up", icon: Shield, route: "/protocol/admin/experts" },
    { title: "Total Users", value: String(live.users), change: "+23%", trend: "up", icon: Users, route: "/protocol/admin/users" },
    { title: "Platform Revenue", value: `$${live.revenue.toLocaleString()}`, change: "+18%", trend: "up", icon: DollarSign, route: "/protocol/admin/revenue" },
    { title: "Active Countries", value: String(live.countries), change: "+3", trend: "up", icon: Globe, route: "/protocol/admin/countries" },
  ];

  return (
    <ProtocolLayout role="admin" breadcrumbs={[{ label: "Command Center", href: "/protocol/admin" }]}>
      <div className="space-y-6 animate-page-enter">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={stat.title}
              onClick={() => navigate(stat.route)}
              className="protocol-card cursor-pointer group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 protocol-glow">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className={`flex items-center text-sm ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-1">{stat.value}</h3>
                <p className="text-muted-foreground text-sm flex items-center justify-between">
                  {stat.title}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 protocol-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white/90 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Revenue Overview
              </CardTitle>
              <select className="bg-white/5 border border-white/10 text-white/60 text-sm rounded-lg px-3 py-1">
                <option>Last 7 months</option>
                <option>Last 12 months</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a24', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fill="url(#revenueGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Country Distribution */}
          <Card className="protocol-card">
            <CardHeader>
              <CardTitle className="text-white/90 flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                Experts by Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expertsByCountry}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="experts"
                    >
                      {expertsByCountry.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a24', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {expertsByCountry.slice(0, 4).map((item) => (
                  <div key={item.country} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white/50 text-xs">{item.country}</span>
                    <span className="text-white/80 text-xs ml-auto">{item.experts}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="protocol-card">
            <CardHeader>
              <CardTitle className="text-white/90 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-emerald-500' :
                      activity.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm truncate">{activity.action}</p>
                      <p className="text-white/40 text-xs">{activity.name}</p>
                    </div>
                    <span className="text-white/30 text-xs whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="protocol-card">
            <CardHeader>
              <CardTitle className="text-white/90 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "View All Experts", route: "/protocol/admin/experts", icon: Shield },
                  { label: "User Management", route: "/protocol/admin/users", icon: Users },
                  { label: "Country Analytics", route: "/protocol/admin/countries", icon: Globe },
                  { label: "Revenue Reports", route: "/protocol/admin/revenue", icon: DollarSign },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.route)}
                    className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 transition-all group"
                  >
                    <action.icon className="w-5 h-5 text-amber-500" />
                    <span className="text-white/70 text-sm group-hover:text-white/90">{action.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtocolLayout>
  );
};

export default AdminDashboard;
