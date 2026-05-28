import { useState } from "react";
import { 
  Shield, Search, Filter, MoreVertical, Eye, Ban, CheckCircle,
  ChevronLeft, ChevronRight, Mail, Globe, Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { toast } from "sonner";

// Mock experts data
const mockExperts = [
  { 
    id: 1, 
    name: "Dr. Sarah Chen", 
    email: "sarah.chen@protocol.io",
    specialty: "AI & Machine Learning",
    country: "USA",
    students: 156,
    revenue: 45200,
    status: "active",
    joinedAt: "2024-01-15",
    avatar: "SC"
  },
  { 
    id: 2, 
    name: "Marcus Webb", 
    email: "marcus.webb@protocol.io",
    specialty: "Blockchain Development",
    country: "UK",
    students: 234,
    revenue: 67800,
    status: "active",
    joinedAt: "2024-02-20",
    avatar: "MW"
  },
  { 
    id: 3, 
    name: "Priya Sharma", 
    email: "priya.sharma@protocol.io",
    specialty: "Data Science",
    country: "India",
    students: 312,
    revenue: 52100,
    status: "active",
    joinedAt: "2023-11-08",
    avatar: "PS"
  },
  { 
    id: 4, 
    name: "Ahmed Hassan", 
    email: "ahmed.hassan@protocol.io",
    specialty: "Cybersecurity",
    country: "UAE",
    students: 89,
    revenue: 28500,
    status: "pending",
    joinedAt: "2024-03-10",
    avatar: "AH"
  },
  { 
    id: 5, 
    name: "John Doe", 
    email: "john.doe@protocol.io",
    specialty: "Web Development",
    country: "Canada",
    students: 45,
    revenue: 12300,
    status: "suspended",
    joinedAt: "2024-01-25",
    avatar: "JD"
  },
  { 
    id: 6, 
    name: "Elena Rodriguez", 
    email: "elena.rodriguez@protocol.io",
    specialty: "Cloud Architecture",
    country: "Spain",
    students: 178,
    revenue: 41600,
    status: "active",
    joinedAt: "2023-12-15",
    avatar: "ER"
  },
];

const ExpertsManagement = () => {
  const [experts, setExperts] = useState(mockExperts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedExpert, setSelectedExpert] = useState<typeof mockExperts[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || expert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredExperts.length / perPage);
  const paginatedExperts = filteredExperts.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleStatusChange = (expertId: number, newStatus: string) => {
    setExperts(experts.map(exp => 
      exp.id === expertId ? { ...exp, status: newStatus } : exp
    ));
    toast.success(`Expert status updated to ${newStatus}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Pending</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/30">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <ProtocolLayout role="admin" breadcrumbs={[{ label: "Admin", href: "/protocol/admin" }, { label: "Experts", href: "/protocol/admin/experts" }]}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Experts", value: experts.length, icon: Shield },
            { label: "Active", value: experts.filter(e => e.status === "active").length, color: "text-emerald-400" },
            { label: "Pending Approval", value: experts.filter(e => e.status === "pending").length, color: "text-amber-400" },
            { label: "Suspended", value: experts.filter(e => e.status === "suspended").length, color: "text-red-400" },
          ].map((stat, i) => (
            <Card key={i} className="bg-[#12121a] border-white/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                <div className={`text-sm ${stat.color || 'text-white/50'}`}>{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Card className="bg-[#12121a] border-white/5">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-white/90 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              All Experts (CAD Owners)
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Search experts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-white/10 text-white/70">
                    <Filter className="w-4 h-4 mr-2" />
                    {statusFilter === "all" ? "All Status" : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a24] border-white/10">
                  {["all", "active", "pending", "suspended"].map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className="text-white/70 focus:text-white focus:bg-white/10"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-white/40 text-sm font-medium">Expert</th>
                    <th className="text-left py-3 px-4 text-white/40 text-sm font-medium">Specialty</th>
                    <th className="text-left py-3 px-4 text-white/40 text-sm font-medium">Country</th>
                    <th className="text-left py-3 px-4 text-white/40 text-sm font-medium">Students</th>
                    <th className="text-left py-3 px-4 text-white/40 text-sm font-medium">Revenue</th>
                    <th className="text-left py-3 px-4 text-white/40 text-sm font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-white/40 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExperts.map((expert) => (
                    <tr key={expert.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium">
                            {expert.avatar}
                          </div>
                          <div>
                            <p className="text-white/90 font-medium">{expert.name}</p>
                            <p className="text-white/40 text-sm">{expert.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white/70">{expert.specialty}</td>
                      <td className="py-4 px-4 text-white/70">{expert.country}</td>
                      <td className="py-4 px-4 text-white/70">{expert.students}</td>
                      <td className="py-4 px-4 text-emerald-400">${expert.revenue.toLocaleString()}</td>
                      <td className="py-4 px-4">{getStatusBadge(expert.status)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedExpert(expert)}
                            className="text-white/50 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-white/50 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1a1a24] border-white/10">
                              {expert.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(expert.id, "active")}
                                  className="text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {expert.status === "active" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(expert.id, "suspended")}
                                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {expert.status === "suspended" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(expert.id, "active")}
                                  className="text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
              <p className="text-white/40 text-sm">
                Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filteredExperts.length)} of {filteredExperts.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="border-white/10 text-white/70"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-amber-500 hover:bg-amber-600" : "border-white/10 text-white/70"}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="border-white/10 text-white/70"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expert Detail Modal */}
        <Dialog open={!!selectedExpert} onOpenChange={() => setSelectedExpert(null)}>
          <DialogContent className="bg-[#12121a] border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                  {selectedExpert?.avatar}
                </div>
                {selectedExpert?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedExpert && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-white/40 text-sm mb-1">Email</p>
                    <p className="text-white/90 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-500" />
                      {selectedExpert.email}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-white/40 text-sm mb-1">Country</p>
                    <p className="text-white/90 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-500" />
                      {selectedExpert.country}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-white/40 text-sm mb-1">Students</p>
                    <p className="text-white/90 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      {selectedExpert.students}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-white/40 text-sm mb-1">Total Revenue</p>
                    <p className="text-emerald-400 font-semibold">${selectedExpert.revenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-white/40 text-sm mb-1">Specialty</p>
                  <p className="text-white/90">{selectedExpert.specialty}</p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white/40 text-sm mb-1">Status</p>
                    {getStatusBadge(selectedExpert.status)}
                  </div>
                  <p className="text-white/40 text-sm">Joined {selectedExpert.joinedAt}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtocolLayout>
  );
};

export default ExpertsManagement;
