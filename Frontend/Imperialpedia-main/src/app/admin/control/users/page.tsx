'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle2, 
  Loader2,
  Filter,
  ShieldAlert,
  MoreVertical,
  Mail,
  ArrowRight,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { usersService } from '@/services/data/users-service';
import { User, UserStatus, Role } from '@/types';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

/**
 * Admin User Management Hub.
 * Optimized for high-scale identity traversal and access orchestration.
 */
export default function UserControlDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterType] = useState<string>('all');

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await usersService.getUsers();
        if (response.data) setUsers(response.data);
      } catch (e) {
        console.error('Identity sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                         u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status: UserStatus = 'active') => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold uppercase gap-1.5 h-6 px-3">
            <CheckCircle2 className="h-2.5 w-2.5" /> Active
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive" className="text-[10px] font-bold uppercase gap-1.5 h-6 px-3">
            <Ban className="h-2.5 w-2.5" /> Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px] font-bold uppercase h-6 px-3">{status}</Badge>;
    }
  };

  const handleStatusToggle = (userId: string, currentStatus: UserStatus = 'active') => {
    const newStatus: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    
    toast({
      title: newStatus === 'suspended' ? "Identity Suspended" : "Identity Reactivated",
      description: `User access status has been updated.`,
      variant: newStatus === 'suspended' ? 'destructive' : 'default',
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as Role } : u));
    toast({
      title: "Persona Updated",
      description: `User role has been migrated to ${newRole}.`,
    });
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({ 
      title: "User Purged", 
      description: "Identity has been removed from the platform index.", 
      variant: "destructive" 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldAlert className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Identity Kernel</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">User Management</Text>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 shadow-xl shadow-primary/20 font-bold transition-all scale-105 active:scale-95">
          <UserPlus className="mr-2 h-4 w-4" /> Provision New Identity
        </Button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-md sticky top-20 z-30 shadow-lg">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by identity name, email, or handle..." 
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterRole} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-12 bg-background/50 border-white/10 rounded-xl font-bold text-xs">
              <Filter className="mr-2 h-3.5 w-3.5 text-primary" />
              <SelectValue placeholder="All Personas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="creator">Creator</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs">
            <Filter className="h-3.5 w-3.5" /> More Refinements
          </Button>
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">User Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Email Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Persona Architect</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Lifecycle Status</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Syncing Identity Matrix...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No matching identities localized in current search buffer.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-6 pl-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 rounded-2xl border-2 border-white/5 group-hover:border-primary/30 transition-colors shadow-lg">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold flex items-center gap-1.5 group-hover:text-primary transition-colors">
                          {user.name}
                          {user.role === 'admin' && <ShieldCheck className="h-3.5 w-3.5 text-secondary" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">ID: {user.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 opacity-40" /> {user.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Select 
                        defaultValue={user.role} 
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                      >
                        <SelectTrigger className="w-[140px] h-9 text-[10px] font-bold uppercase tracking-widest bg-background/50 border-white/5 rounded-lg shadow-inner">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="creator">Creator</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(user.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-transparent hover:border-white/10 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 glass-card border-white/10 p-1">
                          <DropdownMenuLabel className="text-[9px] uppercase font-bold tracking-widest opacity-50 px-3 py-2">Quick Commands</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-lg h-10 px-3" onClick={() => handleStatusToggle(user.id, user.status)}>
                            {user.status === 'suspended' ? (
                              <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Reactivate Access</>
                            ) : (
                              <><Ban className="mr-2 h-4 w-4 text-destructive" /> Deactivate Account</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg h-10 px-3">
                            <ShieldAlert className="mr-2 h-4 w-4 text-primary" /> Force Credential Reset
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 rounded-lg h-10 px-3" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Purge Identity
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <UsersIcon className="h-24 w-24" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold" className="text-primary flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Zero-Trust Provisioning
            </Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Every provisioned identity is cryptographically unique. Changes to Persona assignments propagate across the Intelligence clusters within **180 seconds**.
            </Text>
          </div>
        </Card>

        <Card className="glass-card bg-secondary/5 border-secondary/20 p-8 flex flex-col gap-4">
          <div>
            <Text variant="bodySmall" weight="bold" className="text-secondary flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Bulk Orchestration
            </Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Use the Activation Hub for at-scale identity state transitions. Multi-factor verification is enforced for all administrative level Persona shifts.
            </Text>
            <Button variant="link" className="p-0 h-auto text-secondary text-xs font-bold mt-4 group" asChild>
              <Link href="/admin/control/users/activation">
                Open Activation Hub <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="glass-card border-white/5 p-8 flex flex-col gap-4 bg-muted/5">
          <div>
            <Text variant="bodySmall" weight="bold" className="text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Identity Retention
            </Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Suspended identities are retained in the deep-archive for **30 days** before a permanent purge cycle is initiated. All research drafts are locked during deactivation.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}