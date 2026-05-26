'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Calendar,
  Eye,
  Trash2,
  ArrowUpRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  UserCheck,
  UserX,
  UserPlus
} from 'lucide-react';
import { collection, query, where, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { User, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export default function UserManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // 1. Fetch Users
  const userQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: users, loading } = useCollection<any>(userQuery);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    const userRef = doc(db!, 'users', userId);
    updateDoc(userRef, { status: newStatus, updatedAt: new Date().toISOString() })
      .then(() => toast({ title: `User ${newStatus.toLowerCase()}` }))
      .catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: `/users/${userId}`,
          operation: 'update',
          requestResourceData: { status: newStatus }
        }));
      });
  };

  const handlePromoteAdmin = async (userId: string) => {
    const userRef = doc(db!, 'users', userId);
    updateDoc(userRef, { role: 'ADMIN', updatedAt: new Date().toISOString() })
      .then(() => toast({ title: "User promoted to Admin" }))
      .catch(() => toast({ variant: 'destructive', title: 'Promotion failed' }));
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db!, 'users', userId));
      toast({ title: "User permanently removed" });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Deletion failed' });
    }
  };

  const handleBulkStatus = async (status: UserStatus) => {
    const batch = writeBatch(db!);
    selectedIds.forEach(id => {
      batch.update(doc(db!, 'users', id), { status, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
    toast({ title: `Bulk ${status.toLowerCase()} applied to ${selectedIds.length} users.` });
    setSelectedIds([]);
  };

  const exportCSV = () => {
    const headers = "ID,Name,Email,Role,Status,Joined\n";
    const rows = filteredUsers.map(u =>
      `${u.id},${u.displayName},${u.email},${u.role},${u.status || 'ACTIVE'},${u.createdAt}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baalvion_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "User directory exported" });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === paginatedUsers.length ? [] : paginatedUsers.map(u => u.id));
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-slate-500 font-medium">Manage marketplace accounts, roles, and platform access.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
            <Plus className="mr-2 h-4 w-4" /> Add User Manually
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or ID..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[140px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold">All Roles</SelectItem>
                <SelectItem value="BRAND" className="font-bold">Brands</SelectItem>
                <SelectItem value="CREATOR" className="font-bold">Creators</SelectItem>
                <SelectItem value="ADMIN" className="font-bold">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold">All Status</SelectItem>
                <SelectItem value="ACTIVE" className="font-bold">Active</SelectItem>
                <SelectItem value="SUSPENDED" className="font-bold text-red-600">Suspended</SelectItem>
                <SelectItem value="PENDING" className="font-bold">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 bg-primary/5 p-1 rounded-xl border border-primary/10"
            >
              <span className="text-[10px] font-black text-primary uppercase px-3">{selectedIds.length} Selected</span>
              <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-red-600" onClick={() => handleBulkStatus('SUSPENDED')}>Suspend</Button>
              <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-emerald-600" onClick={() => handleBulkStatus('ACTIVE')}>Restore</Button>
              <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-slate-400" onClick={() => setSelectedIds([])}>Cancel</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Users Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="w-12 pl-8">
                  <Checkbox
                    checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">User Identity</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Account Role</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Verification</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Joined Date</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, idx) => (
                  <TableRow key={user.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24">
                    <TableCell className="pl-8">
                      <Checkbox
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 rounded-xl border border-slate-100 shadow-sm">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback className="bg-primary/5 text-primary font-black">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 leading-none truncate max-w-[180px]">{user.displayName || 'Unnamed User'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1.5 truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border-none",
                        user.role === 'ADMIN' ? "bg-slate-900 text-white" :
                          user.role === 'BRAND' ? "bg-primary/10 text-primary" :
                            "bg-orange-100 text-orange-600"
                      )}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border-none",
                        (user.status || 'ACTIVE') === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" :
                          (user.status || 'ACTIVE') === 'SUSPENDED' ? "bg-red-100 text-red-600" :
                            "bg-orange-100 text-orange-600"
                      )}>
                        {user.status || 'ACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.role !== 'ADMIN' && (
                        <div className="flex justify-center">
                          {user.isVerified ? (
                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                          ) : (
                            <ShieldAlert className="h-5 w-5 text-slate-200" />
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ID: {user.id.substring(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg font-bold text-xs" asChild>
                          <a href={user.role === 'CREATOR' ? `/creator/${user.displayName?.toLowerCase().replace(' ', '_')}` : '#'} target="_blank">
                            <Eye className="h-4 w-4 mr-1.5" /> Profile
                          </a>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 border-none shadow-2xl">
                            <DropdownMenuLabel>Account Operations</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-lg font-bold">
                              <Mail className="mr-2 h-4 w-4" /> Message User
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg font-bold" onClick={() => handleUpdateStatus(user.id, (user.status || 'ACTIVE') === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}>
                              {(user.status || 'ACTIVE') === 'ACTIVE' ? (
                                <><UserX className="mr-2 h-4 w-4 text-red-600" /> Suspend Account</>
                              ) : (
                                <><UserCheck className="mr-2 h-4 w-4 text-emerald-600" /> Restore Account</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.role !== 'ADMIN' && (
                              <DropdownMenuItem className="rounded-lg font-bold" onClick={() => handlePromoteAdmin(user.id)}>
                                <UserPlus className="mr-2 h-4 w-4 text-primary" /> Promote to Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="rounded-lg font-bold text-red-600" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <Users className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No users found matching filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination Footer */}
        <CardFooter className="p-6 border-t bg-slate-50/30 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">
            Showing <span className="text-slate-900">{Math.min(filteredUsers.length, page * pageSize)}</span> of <span className="text-slate-900">{filteredUsers.length}</span> total users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 w-9 p-0 bg-white border-slate-200"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? 'primary' : 'ghost'}
                  size="sm"
                  className="rounded-xl h-9 w-9 p-0 font-bold"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 w-9 p-0 bg-white border-slate-200"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Security Context Banner */}
      <div className="p-8 rounded-[2.5rem] bg-indigo-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
        <ShieldAlert className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
          <ShieldAlert className="h-8 w-8 text-orange-400" />
        </div>
        <div className="space-y-2 relative z-10">
          <h3 className="text-lg font-bold">Account Governance Notice</h3>
          <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
            Administrative actions are logged and timestamped. Suspending an account will instantly revoke all platform session tokens and freeze pending escrow payouts for the user.
          </p>
        </div>
      </div>
    </div>
  );
}