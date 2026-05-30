import { useState, useEffect } from "react";
import { Users, UserPlus, UserCheck, UserX, Activity, Search, Filter, Eye, Ban, MoreHorizontal, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { protocolApi } from "@/lib/protocol-api";
import { toast } from "sonner";

const userGrowth = [
  { month: "Jan", users: 2450, active: 1890 },
  { month: "Feb", users: 3200, active: 2450 },
  { month: "Mar", users: 4100, active: 3200 },
  { month: "Apr", users: 5300, active: 4100 },
  { month: "May", users: 6800, active: 5200 },
  { month: "Jun", users: 8500, active: 6500 },
  { month: "Jul", users: 10200, active: 7800 },
  { month: "Aug", users: 12000, active: 9100 },
  { month: "Sep", users: 14500, active: 11000 },
  { month: "Oct", users: 17200, active: 13100 },
  { month: "Nov", users: 20500, active: 15600 },
  { month: "Dec", users: 24000, active: 18200 },
];

const activityByHour = [
  { hour: "00:00", sessions: 120 },
  { hour: "04:00", sessions: 80 },
  { hour: "08:00", sessions: 350 },
  { hour: "12:00", sessions: 580 },
  { hour: "16:00", sessions: 720 },
  { hour: "20:00", sessions: 890 },
  { hour: "23:00", sessions: 450 },
];

const mockUsers = [
  { id: 1, name: "Alex Morgan", email: "alex@protocol.io", role: "student", status: "active", lastActive: "Just now", joined: "2024-01-15", sessions: 145 },
  { id: 2, name: "Sarah Chen", email: "sarah@protocol.io", role: "expert", status: "active", lastActive: "5 min ago", joined: "2024-02-20", sessions: 312 },
  { id: 3, name: "James Wilson", email: "james@protocol.io", role: "student", status: "inactive", lastActive: "2 days ago", joined: "2024-01-28", sessions: 23 },
  { id: 4, name: "Emma Davis", email: "emma@protocol.io", role: "expert", status: "active", lastActive: "1 hour ago", joined: "2024-03-05", sessions: 189 },
  { id: 5, name: "Michael Brown", email: "michael@protocol.io", role: "student", status: "suspended", lastActive: "1 week ago", joined: "2024-02-14", sessions: 67 },
  { id: 6, name: "Lisa Johnson", email: "lisa@protocol.io", role: "student", status: "active", lastActive: "3 hours ago", joined: "2024-01-10", sessions: 234 },
];

const recentActivity = [
  { user: "Alex Morgan", action: "Joined live session", time: "2 min ago", type: "call" },
  { user: "Sarah Chen", action: "Created new post", time: "5 min ago", type: "content" },
  { user: "James Wilson", action: "Purchased content", time: "12 min ago", type: "purchase" },
  { user: "Emma Davis", action: "Started live stream", time: "18 min ago", type: "stream" },
  { user: "Lisa Johnson", action: "Completed course", time: "25 min ago", type: "achievement" },
];

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([protocolApi.students.list(), protocolApi.experts.list()]).then(([students, experts]) => {
      setUsers([
        ...students.map((s: any) => ({ id: s.id, name: s.name, email: s.email, role: "student", status: s.status === "online" ? "active" : "inactive", lastActive: s.lastActive, joined: s.joined, sessions: 0 })),
        ...experts.map((e: any) => ({ id: e.id, name: e.name, email: e.email, role: "expert", status: e.status, lastActive: "—", joined: e.joinedAt, sessions: e.students })),
      ]);
    });
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const stats = [
    { title: "Total Users", value: "24,000", change: "+17%", icon: Users },
    { title: "New This Month", value: "3,500", change: "+12%", icon: UserPlus },
    { title: "Active Now", value: "1,284", change: "+8%", icon: UserCheck },
    { title: "Churned", value: "156", change: "-3%", icon: UserX },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <ProtocolLayout role="admin" breadcrumbs={[{ label: "Admin", href: "/protocol/admin" }, { label: "Users", href: "/protocol/admin/users" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide text-white mb-2">User Management</h1>
          <p className="text-white/50">Monitor user activity and manage accounts</p>
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
                  <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-white/50 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Growth Chart */}
          <Card className="bg-white/5 border-amber-500/10 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowth}>
                    <defs>
                      <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="users" stroke="#f59e0b" fillOpacity={1} fill="url(#usersGrad)" name="Total Users" />
                    <Area type="monotone" dataKey="active" stroke="#22c55e" fillOpacity={1} fill="url(#activeGrad)" name="Active Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity by Hour */}
          <Card className="bg-white/5 border-amber-500/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                Peak Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="hour" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }} />
                    <Bar dataKey="sessions" fill="#f59e0b" name="Sessions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <Card className="bg-white/5 border-amber-500/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-medium">
                      {activity.user.charAt(0)}
                    </div>
                    <span className="text-white text-sm font-medium truncate">{activity.user}</span>
                  </div>
                  <p className="text-white/70 text-sm">{activity.action}</p>
                  <p className="text-white/40 text-xs mt-1">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/5 border-amber-500/10">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-white">All Users</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-amber-500/20 text-white placeholder:text-white/40 w-48"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32 bg-white/5 border-amber-500/20 text-white">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-amber-500/20">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="expert">Experts</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-white/5 border-amber-500/20 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-amber-500/20">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/10">
                    <th className="text-left p-4 text-white/50 font-medium">User</th>
                    <th className="text-left p-4 text-white/50 font-medium">Role</th>
                    <th className="text-left p-4 text-white/50 font-medium">Status</th>
                    <th className="text-left p-4 text-white/50 font-medium">Last Active</th>
                    <th className="text-left p-4 text-white/50 font-medium">Sessions</th>
                    <th className="text-right p-4 text-white/50 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-amber-500/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-white/50 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'expert' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          user.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-white/70">{user.lastActive}</td>
                      <td className="p-4 text-white/70">{user.sessions}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowProfileModal(true);
                            }}
                            className="text-amber-400 hover:bg-amber-500/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1a1a2e] border-amber-500/20">
                              <DropdownMenuItem 
                                onClick={() => toast.success(`${user.name} suspended`)}
                                className="text-red-400 hover:bg-red-500/10"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-medium">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-medium">{selectedUser.name}</h3>
                  <p className="text-white/50">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-500/10">
                <div>
                  <p className="text-white/50 text-sm">Role</p>
                  <p className="text-white capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Status</p>
                  <p className={selectedUser.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                    {selectedUser.status}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Total Sessions</p>
                  <p className="text-white">{selectedUser.sessions}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Joined</p>
                  <p className="text-white">{selectedUser.joined}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileModal(false)} className="border-amber-500/20 text-white hover:bg-white/5">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtocolLayout>
  );
};

export default AdminUsers;
