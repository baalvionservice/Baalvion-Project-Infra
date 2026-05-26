'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  UserCheck, 
  UserMinus, 
  Search, 
  Loader2, 
  ArrowLeft,
  Filter,
  CheckCircle2,
  Ban,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { usersService } from '@/services/data/users-service';
import { User, UserStatus } from '@/types';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

/**
 * Bulk User Activation & Status Management.
 * Specialized tool for mass identity state transitions.
 */
export default function UserActivationPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');

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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async (status: UserStatus) => {
    if (selectedIds.length === 0) return;

    setProcessing(true);
    try {
      const response = await usersService.updateUserStatuses(selectedIds, status);
      if (response.data) {
        setUsers(prev => prev.map(u => 
          selectedIds.includes(u.id) ? { ...u, status } : u
        ));
        toast({
          title: status === 'active' ? "Users Activated" : "Users Suspended",
          description: `Successfully updated ${selectedIds.length} identity nodes.`,
        });
        setSelectedIds([]);
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Synchronization Error",
        description: "Failed to broadcast status changes to the identity cluster.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: UserStatus = 'active') => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold uppercase gap-1 h-5 px-2">
            <CheckCircle2 className="h-2.5 w-2.5" /> Active
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive" className="text-[9px] font-bold uppercase gap-1 h-5 px-2">
            <Ban className="h-2.5 w-2.5" /> Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[9px] font-bold uppercase h-5 px-2">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/control/users"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldAlert className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Identity Orchestration</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Bulk Status Control</Text>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleBulkUpdate('suspended')}
            disabled={selectedIds.length === 0 || processing}
            className="h-11 px-6 rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/5"
          >
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
            Suspend Selected ({selectedIds.length})
          </Button>
          <Button 
            onClick={() => handleBulkUpdate('active')}
            disabled={selectedIds.length === 0 || processing}
            className="h-11 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"
          >
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
            Activate Selected
          </Button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by identity node (name or email)..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 px-4 rounded-xl border-white/10 gap-2 font-bold text-xs bg-background/30">
          <Filter className="h-3.5 w-3.5" /> Matrix Filters
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="w-12 pl-6">
                  <Checkbox 
                    checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">User Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Email Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Current Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Identity ID</TableHead>
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
                    No identities localized in the current search buffer.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  className={`group transition-colors border-b border-white/5 ${
                    selectedIds.includes(user.id) ? 'bg-primary/5' : 'hover:bg-muted/10'
                  }`}
                >
                  <TableCell className="pl-6">
                    <Checkbox 
                      checked={selectedIds.includes(user.id)}
                      onCheckedChange={() => toggleSelect(user.id)}
                    />
                  </TableCell>
                  <TableCell className="py-5">
                    <span className="text-sm font-bold block">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.role}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-medium">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(user.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border border-white/5">
                      {user.id}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Strategic Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Batch Integrity</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Batch operations are processed sequentially to ensure cryptographic integrity. Suspended users lose access to all intelligence hubs and private research drafts immediately.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Reactivation Protocol</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Activating an identity node restores all previous permissions and historical analytics. Users will receive an automated dispatch notifying them of their restored access.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
