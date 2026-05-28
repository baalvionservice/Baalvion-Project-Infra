/**
 * Expert Dashboard - Main dashboard for CAD owners
 * TODO: Replace mock data with API calls when backend is ready
 * TODO: Implement real-time student count via WebSocket
 * TODO: Connect to payment API for actual earnings
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, DollarSign, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { mockRevenueData, mockActivityData } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Using centralized mock data from src/data/mockData.ts

const ExpertDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { 
      title: "Total Students", 
      value: "1,284", 
      icon: Users, 
      change: "+12%",
      route: "/protocol/expert/students"
    },
    { 
      title: "Online Now", 
      value: "347", 
      icon: UserCheck, 
      change: "+5%",
      status: "online",
      route: "/protocol/expert/students"
    },
    { 
      title: "Offline", 
      value: "937", 
      icon: UserX, 
      change: "-3%",
      route: "/protocol/expert/students"
    },
    { 
      title: "Total Earnings", 
      value: "$42,850", 
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
