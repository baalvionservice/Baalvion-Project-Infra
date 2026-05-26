import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserPlus,
  Mail,
  Ban,
  Edit,
  Trash2,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Calendar,
  AlertTriangle,
  XCircle,
  HardDrive,
  Coins,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnhancedUser } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAdminUsers, useBanUser, useSuspendUser, useReactivateUser } from "@/hooks/useAdmin";

const enforcementConfig: Record<string, { label: string; variant: "warning" | "destructive" | "secondary" | "success"; icon: typeof AlertTriangle }> = {
  normal: { label: "Normal", variant: "success", icon: Play },
  warning: { label: "80% Used", variant: "warning", icon: AlertTriangle },
  critical: { label: "90% Used", variant: "destructive", icon: AlertTriangle },
  blocked: { label: "Blocked", variant: "destructive", icon: XCircle },
};


export default function AdminUsers() {
  const { data: usersPage, refetch } = useAdminUsers({ page: 1, pageSize: 100 });
  const banUser = useBanUser();
  const suspendUser = useSuspendUser();
  const reactivateUser = useReactivateUser();

  const apiUsers: EnhancedUser[] = (usersPage?.data ?? []).map((u) => ({
    id: parseInt(u.id) || 0,
    name: u.name,
    email: u.email,
    plan: u.role === "platform_admin" ? "Enterprise" : u.role === "owner" ? "Growth" : "Starter",
    status: (u.status as EnhancedUser["status"]) ?? "active",
    bandwidth: "N/A",
    createdAt: new Date(u.createdAt).toLocaleDateString(),
    lastLogin: new Date(u.updatedAt).toLocaleDateString(),
    usagePercent: 0,
    expiryDate: "N/A",
    enforcementState: "normal" as const,
  }));

  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [bandwidthModal, setBandwidthModal] = useState<EnhancedUser | null>(null);
  const [creditModal, setCreditModal] = useState<EnhancedUser | null>(null);
  const [bwValue, setBwValue] = useState("");
  const [creditValue, setCreditValue] = useState("");
  const { toast } = useToast();

  useEffect(() => { if (apiUsers.length > 0) setUsers(apiUsers); }, [usersPage]);


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesPlan = planFilter === "all" || user.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleAction = (action: string, userId: number, userName: string) => {
    setUsers(users.map(u => {
      if (u.id !== userId) return u;
      
      switch (action) {
        case "pause":
          return { ...u, status: "paused" as const };
        case "resume":
          return { ...u, status: "active" as const };
        case "ban":
          return { ...u, status: "banned" as const, enforcementState: "blocked" as const };
        case "reset":
          return { ...u, usagePercent: 0, enforcementState: "normal" as const };
        case "extend":
          return { ...u, expiryDate: "2025-12-31" };
        default:
          return u;
      }
    }));

    const actionLabels: Record<string, string> = {
      pause: "paused",
      resume: "resumed",
      ban: "banned",
      reset: "usage reset for",
      extend: "expiry extended for",
    };

    toast({
      title: `User ${actionLabels[action] || action}`,
      description: `${userName} has been ${actionLabels[action] || action}`,
    });
  };

  const pausedCount = users.filter(u => u.status === "paused").length;
  const bannedCount = users.filter(u => u.status === "banned").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users and their subscriptions.</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">
              {users.filter(u => u.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paused</p>
            <p className="text-2xl font-bold text-warning">{pausedCount}</p>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Banned</p>
            <p className="text-2xl font-bold text-destructive">{bannedCount}</p>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Enterprise</p>
            <p className="text-2xl font-bold text-primary">
              {users.filter(u => u.plan === "Enterprise").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="default">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card variant="default">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enforcement</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const enforcement = enforcementConfig[user.enforcementState || "normal"];
                const EnforcementIcon = enforcement.icon;
                
                return (
                  <TableRow key={user.id} className="border-border/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.plan === "Enterprise" ? "default" : 
                        user.plan === "Professional" ? "success" : "muted"
                      }>
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{user.bandwidth}</span>
                          <span className={
                            user.usagePercent >= 100 ? "text-destructive" :
                            user.usagePercent >= 90 ? "text-destructive" :
                            user.usagePercent >= 80 ? "text-warning" : ""
                          }>
                            {user.usagePercent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              user.usagePercent >= 100 ? "bg-destructive" :
                              user.usagePercent >= 90 ? "bg-destructive" :
                              user.usagePercent >= 80 ? "bg-warning" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(user.usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.status === "active" ? "success" : 
                        user.status === "paused" ? "warning" :
                        user.status === "banned" ? "destructive" : "secondary"
                      }>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.enforcementState && user.enforcementState !== "normal" && (
                        <Badge variant={enforcement.variant} className="gap-1">
                          <EnforcementIcon className="w-3 h-3" />
                          {enforcement.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.expiryDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "active" || user.status === "suspended" ? (
                            <DropdownMenuItem 
                              onClick={() => handleAction("pause", user.id, user.name)}
                              className="text-warning"
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pause User
                            </DropdownMenuItem>
                          ) : user.status === "paused" ? (
                            <DropdownMenuItem 
                              onClick={() => handleAction("resume", user.id, user.name)}
                              className="text-success"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Resume User
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem 
                            onClick={() => handleAction("reset", user.id, user.name)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset Usage
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("extend", user.id, user.name)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Extend Expiry
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setBandwidthModal(user); setBwValue(""); }}>
                            <HardDrive className="w-4 h-4 mr-2" />
                            Adjust Bandwidth
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setCreditModal(user); setCreditValue(""); }}>
                            <Coins className="w-4 h-4 mr-2" />
                            Add / Deduct Credits
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status !== "banned" ? (
                            <DropdownMenuItem
                              onClick={() => handleAction("ban", user.id, user.name)}
                              className="text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Ban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleAction("resume", user.id, user.name)}
                              className="text-success"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Unban User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>

                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bandwidth Adjustment Modal */}
      <Dialog open={!!bandwidthModal} onOpenChange={() => setBandwidthModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><HardDrive className="w-5 h-5 text-primary" />Adjust Bandwidth</DialogTitle>
            <DialogDescription>Manually adjust the bandwidth allocation for {bandwidthModal?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-secondary/30 text-sm">
              <p className="text-muted-foreground">Current allocation</p>
              <p className="font-mono font-bold">{bandwidthModal?.bandwidth}</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">New Bandwidth Limit (GB)</label>
              <Input placeholder="e.g. 500" value={bwValue} onChange={e => setBwValue(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setBwValue(String(Number(bwValue || 0) + 100))}>+100 GB</Button>
              <Button variant="outline" size="sm" onClick={() => setBwValue(String(Number(bwValue || 0) + 250))}>+250 GB</Button>
              <Button variant="outline" size="sm" onClick={() => setBwValue(String(Number(bwValue || 0) + 500))}>+500 GB</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBandwidthModal(null)}>Cancel</Button>
            <Button variant="hero" onClick={() => { sonnerToast.success(`Bandwidth updated to ${bwValue} GB for ${bandwidthModal?.name}`); setBandwidthModal(null); }}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Adjustment Modal */}
      <Dialog open={!!creditModal} onOpenChange={() => setCreditModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Coins className="w-5 h-5 text-primary" />Add / Deduct Credits</DialogTitle>
            <DialogDescription>Manually adjust account credits for {creditModal?.name}. Use negative values to deduct.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-2">Credit Amount (USD)</label>
              <Input placeholder="e.g. 25 or -10" value={creditValue} onChange={e => setCreditValue(e.target.value)} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Reason</label>
              <Input placeholder="e.g. Goodwill credit for service disruption" className="bg-secondary/50" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreditValue("10")}>+$10</Button>
              <Button variant="outline" size="sm" onClick={() => setCreditValue("25")}>+$25</Button>
              <Button variant="outline" size="sm" onClick={() => setCreditValue("50")}>+$50</Button>
              <Button variant="outline" size="sm" onClick={() => setCreditValue("-10")}>-$10</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditModal(null)}>Cancel</Button>
            <Button variant="hero" onClick={() => { sonnerToast.success(`Credits adjusted by $${creditValue} for ${creditModal?.name}`); setCreditModal(null); }}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

