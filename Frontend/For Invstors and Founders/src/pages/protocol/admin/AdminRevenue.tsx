import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { toast } from "sonner";

const monthlyRevenue = [
  { month: "Jan", revenue: 45000, subscriptions: 32000, content: 13000 },
  { month: "Feb", revenue: 52000, subscriptions: 38000, content: 14000 },
  { month: "Mar", revenue: 48000, subscriptions: 35000, content: 13000 },
  { month: "Apr", revenue: 61000, subscriptions: 45000, content: 16000 },
  { month: "May", revenue: 72000, subscriptions: 52000, content: 20000 },
  { month: "Jun", revenue: 85000, subscriptions: 60000, content: 25000 },
  { month: "Jul", revenue: 92000, subscriptions: 65000, content: 27000 },
  { month: "Aug", revenue: 88000, subscriptions: 62000, content: 26000 },
  { month: "Sep", revenue: 95000, subscriptions: 68000, content: 27000 },
  { month: "Oct", revenue: 102000, subscriptions: 72000, content: 30000 },
  { month: "Nov", revenue: 118000, subscriptions: 82000, content: 36000 },
  { month: "Dec", revenue: 135000, subscriptions: 95000, content: 40000 },
];

const revenueBySource = [
  { name: "Subscriptions", value: 65, color: "#f59e0b" },
  { name: "Content Sales", value: 20, color: "#6366f1" },
  { name: "Invite Links", value: 10, color: "#22c55e" },
  { name: "Other", value: 5, color: "#8b5cf6" },
];

const topExperts = [
  { name: "Master Trader", revenue: "$45,230", students: 1284, growth: "+18%" },
  { name: "Crypto Sage", revenue: "$38,450", students: 956, growth: "+12%" },
  { name: "Forex Pro", revenue: "$32,100", students: 823, growth: "+22%" },
  { name: "Options Master", revenue: "$28,900", students: 712, growth: "+8%" },
  { name: "Day Trading Expert", revenue: "$24,500", students: 645, growth: "+15%" },
];

const transactions = [
  { id: 1, type: "Subscription", user: "Alex Morgan", amount: "$99.00", date: "Today, 2:34 PM", status: "completed" },
  { id: 2, type: "Content Purchase", user: "Sarah Chen", amount: "$49.99", date: "Today, 1:12 PM", status: "completed" },
  { id: 3, type: "Invite Link", user: "James Wilson", amount: "$500.00", date: "Today, 11:45 AM", status: "pending" },
  { id: 4, type: "Subscription", user: "Emma Davis", amount: "$199.00", date: "Yesterday", status: "completed" },
  { id: 5, type: "Content Purchase", user: "Michael Brown", amount: "$29.99", date: "Yesterday", status: "refunded" },
];

const AdminRevenue = () => {
  const [timeRange, setTimeRange] = useState("year");

  const stats = [
    { title: "Total Revenue", value: "$993,000", change: "+24%", trend: "up", icon: DollarSign },
    { title: "Monthly Recurring", value: "$95,000", change: "+18%", trend: "up", icon: TrendingUp },
    { title: "Avg. Transaction", value: "$124.50", change: "+5%", trend: "up", icon: ArrowUpRight },
    { title: "Refund Rate", value: "2.1%", change: "-0.3%", trend: "down", icon: TrendingDown },
  ];

  return (
    <ProtocolLayout role="admin" breadcrumbs={[{ label: "Admin", href: "/protocol/admin" }, { label: "Revenue", href: "/protocol/admin/revenue" }]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-white mb-2">Revenue Analytics</h1>
            <p className="text-white/50">Track platform earnings and financial metrics</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-white/5 border-amber-500/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-amber-500/20">
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => toast.success("Report downloaded")}
              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-white/5 border-amber-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <stat.icon className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className={`text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-white/50 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="bg-white/5 border-amber-500/10">
          <CardHeader>
            <CardTitle className="text-white">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="subsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#revenueGrad)" name="Total" />
                  <Area type="monotone" dataKey="subscriptions" stroke="#6366f1" fillOpacity={1} fill="url(#subsGrad)" name="Subscriptions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Source */}
          <Card className="bg-white/5 border-amber-500/10">
            <CardHeader>
              <CardTitle className="text-white">Revenue by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={revenueBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {revenueBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {revenueBySource.map((source) => (
                  <div key={source.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                      <span className="text-white/70 text-sm">{source.name}</span>
                    </div>
                    <span className="text-white font-medium">{source.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Experts */}
          <Card className="bg-white/5 border-amber-500/10 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Top Earning Experts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topExperts.map((expert, index) => (
                  <div key={expert.name} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="text-amber-400 font-medium w-6">#{index + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium">
                      {expert.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{expert.name}</p>
                      <p className="text-white/50 text-sm">{expert.students} students</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{expert.revenue}</p>
                      <p className="text-green-400 text-sm">{expert.growth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-white/5 border-amber-500/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/10">
                    <th className="text-left p-4 text-white/50 font-medium">Type</th>
                    <th className="text-left p-4 text-white/50 font-medium">User</th>
                    <th className="text-left p-4 text-white/50 font-medium">Amount</th>
                    <th className="text-left p-4 text-white/50 font-medium">Date</th>
                    <th className="text-left p-4 text-white/50 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-amber-500/5 hover:bg-white/5">
                      <td className="p-4 text-white">{tx.type}</td>
                      <td className="p-4 text-white/70">{tx.user}</td>
                      <td className="p-4 text-amber-400 font-medium">{tx.amount}</td>
                      <td className="p-4 text-white/50">{tx.date}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtocolLayout>
  );
};

export default AdminRevenue;
