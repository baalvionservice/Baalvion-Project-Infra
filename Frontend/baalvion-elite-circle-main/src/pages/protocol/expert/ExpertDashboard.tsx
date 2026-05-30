/**
 * Expert Dashboard - Main dashboard for CAD owners
 * TODO: Replace mock data with API calls when backend is ready
 * TODO: Implement real-time student count via WebSocket
 * TODO: Connect to payment API for actual earnings
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, DollarSign, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { protocolApi } from "@/lib/protocol-api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Headline stats are live (from protocolApi); the trend charts below are illustrative until
// time-series telemetry is captured.
const mockRevenueData = { monthly: [
  { month: "Jan", revenue: 45000, users: 1200 }, { month: "Feb", revenue: 52000, users: 1450 },
  { month: "Mar", revenue: 48000, users: 1380 }, { month: "Apr", revenue: 61000, users: 1620 },
  { month: "May", revenue: 72000, users: 1890 }, { month: "Jun", revenue: 85000, users: 2150 },
] };
const mockActivityData = [
  { day: "Mon", calls: 12, posts: 8, signups: 45 }, { day: "Tue", calls: 15, posts: 12, signups: 52 },
  { day: "Wed", calls: 8, posts: 6, signups: 38 }, { day: "Thu", calls: 20, posts: 15, signups: 67 },
  { day: "Fri", calls: 18, posts: 10, signups: 54 }, { day: "Sat", calls: 5, posts: 4, signups: 23 },
  { day: "Sun", calls: 3, posts: 2, signups: 18 },
];

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const [live, setLive] = useState({ total: 0, online: 0, offline: 0, earnings: 0 });
  useEffect(() => {
    Promise.all([protocolApi.students.list(), protocolApi.experts.list()]).then(([students, experts]) => {
      const online = students.filter((s: any) => s.status === "online").length;
      const earnings = experts.reduce((a: number, e: any) => a + (e.revenue || 0), 0);
      setLive({ total: students.length, online, offline: students.length - online, earnings });
    });
  }, []);

  const stats = [
    { 
      title: "Total Students",
      value: String(live.total),
      icon: Users, 
      change: "+12%",
      route: "/protocol/expert/students"
    },
    { 
      title: "Online Now",
      value: String(live.online),
      icon: UserCheck, 
      change: "+5%",
      status: "online",
      route: "/protocol/expert/students"
    },
    { 
      title: "Offline",
      value: String(live.offline),
      icon: UserX, 
      change: "-3%",
      route: "/protocol/expert/students"
    },
    { 
      title: "Total Earnings",
      value: `$${live.earnings.toLocaleString()}`,
      icon: DollarSign, 
      change: "+18%",
      route: "/protocol/expert/earnings"
    },
  ];

  return (
    <ProtocolLayout
      role="expert"
      breadcrumbs={[
        { label: "Expert Dashboard", href: "/protocol/expert" }
      ]}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-wide text-white mb-2">Expert Dashboard</h1>
          <p className="text-white/50">Manage your private expertise network</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card 
              key={stat.title}
              className="bg-white/5 border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(stat.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.status === 'online' ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                    <stat.icon className={`w-6 h-6 ${stat.status === 'online' ? 'text-green-400' : 'text-amber-500'}`} />
                  </div>
                  <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-white/50 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-semibold text-white group-hover:text-amber-400 transition-colors">
                  {stat.value}
                </p>
                {stat.status === 'online' && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs">Live</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-amber-500/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockRevenueData.monthly}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a2e', 
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#f59e0b" 
                      fillOpacity={1} 
                      fill="url(#revenueGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-amber-500/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a2e', 
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="calls" fill="#f59e0b" name="Calls" />
                    <Bar dataKey="posts" fill="#6366f1" name="Posts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/5 border-amber-500/10">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Start Call", route: "/protocol/expert/calls" },
                { label: "Create Post", route: "/protocol/expert/feed" },
                { label: "Add Content", route: "/protocol/expert/content" },
                { label: "Generate Link", route: "/protocol/expert/invites" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  className="p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-lg text-amber-400 transition-all duration-300"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtocolLayout>
  );
};

export default ExpertDashboard;
