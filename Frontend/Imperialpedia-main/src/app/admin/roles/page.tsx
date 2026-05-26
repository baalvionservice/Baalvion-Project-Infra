'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  Settings2, 
  Plus, 
  Trash2, 
  Loader2,
  Lock,
  Search,
  Users,
  ShieldAlert,
  ChevronRight,
  Info,
  CheckCircle2,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import { getCmsDashboardData } from '@/services/mock-api/admin-cms';
import { UserRoleItem } from '@/types/system';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

/**
 * Role Governance & Persona Architect.
 * Specialized suite for defining system capabilities and access boundaries.
 * Aligned with Prompt 42 requirements for a permissions matrix.
 */
export default function RoleControlMatrixPage() {
  const [users, setUsers] = useState<UserRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await getCmsDashboardData();
        if (response.data) setUsers(response.data.user_roles);
      } catch (e) {
        console.error('Role matrix sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (username: string, permission: keyof UserRoleItem['permissions']) => {
    setUsers(prev => prev.map(u => {
      if (u.username === username) {
        return {
          ...u,
          permissions: {
            ...u.permissions,
            [permission]: !u.permissions[permission]
          }
        };
      }
      return u;
    }));
    
    toast({
      title: "Capability Synchronized",
      description: `Updated ${permission} permission for ${username}.`,
    });
  };

  const handleAction = (username: string, action: string) => {
    toast({
      title: `Action: ${action}`,
      description: `Modifying node: ${username}`,
    });
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Security Matrix...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Persona Studio</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">User Roles & Permissions</Text>
          </div>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 shadow-xl shadow-primary/20 font-bold transition-all scale-105 active:scale-95">
          <UserPlus className="mr-2 h-4 w-4" /> Provision New Persona
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-20 z-30">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search personas by identity or role..." 
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs">
          <ShieldAlert className="h-4 w-4 text-primary" /> View Security Log
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">User Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Platform Persona</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">View</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Edit</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Delete</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                    No matching identities localized in current governance buffer.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.username} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-6 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-tight block group-hover:text-primary transition-colors">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase h-6 px-3">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={user.permissions.view} 
                      onCheckedChange={() => handleToggle(user.username, 'view')}
                      className="scale-75"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={user.permissions.edit} 
                      onCheckedChange={() => handleToggle(user.username, 'edit')}
                      className="scale-75"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={user.permissions.delete} 
                      onCheckedChange={() => handleToggle(user.username, 'delete')}
                      className="scale-75"
                    />
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all rounded-xl" onClick={() => handleAction(user.username, 'Edit Profile')}>
                        <Settings2 className="h-3.5 w-3.5" /> Configure
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors rounded-xl" onClick={() => handleAction(user.username, 'Purge')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Governance Context Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
        <Card className="glass-card border-none bg-primary/5 p-8 flex items-start gap-6 group hover:border-primary/30 transition-all">
          <div className="p-4 rounded-3xl bg-primary/10 text-primary shrink-0 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <Text variant="bodySmall" weight="bold">Least Privilege Enforced</Text>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Every persona change is cryptographically sealed and logged. Users are granted only the nodes required for their tactical duties.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-none bg-secondary/5 p-8 flex items-start gap-6 group hover:border-secondary/30 transition-all">
          <div className="p-4 rounded-3xl bg-secondary/10 text-secondary shrink-0 group-hover:scale-110 transition-transform">
            <Info className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <Text variant="bodySmall" weight="bold">State Propagation</Text>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Modifying the permission matrix triggers an immediate state broadcast across all 12 platform clusters. Latency is maintained at 180ms.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
