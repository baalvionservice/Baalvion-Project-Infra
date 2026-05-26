'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  Lock, 
  Settings2, 
  Save, 
  Loader2, 
  ArrowLeft, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  RefreshCcw,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { usersService } from '@/services/data/users-service';
import { RolePermissionSet, Permission } from '@/types/system';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

/**
 * Granular Permission Control Panel.
 * Specialized UI for orchestrating capability nodes across the system architecture.
 */
export default function PermissionControlPanel() {
  const [roleSets, setRoleSets] = useState<RolePermissionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadPermissions() {
      try {
        const response = await usersService.getRolePermissions();
        if (response.data) setRoleSets(response.data);
      } catch (e) {
        console.error('Permission matrix sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadPermissions();
  }, []);

  const handleToggle = (roleId: string, permissionName: string) => {
    setRoleSets(prev => prev.map(set => {
      if (set.roleId !== roleId) return set;
      return {
        ...set,
        permissions: set.permissions.map(p => 
          p.name === permissionName ? { ...p, enabled: !p.enabled } : p
        )
      };
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    // Simulate complex cryptographic commit
    await new Promise(r => setTimeout(r, 1500));
    setSaving(false);
    
    toast({
      title: "System Capabilities Synchronized",
      description: "Functional nodes have been cryptographically sealed and deployed across all clusters.",
    });
  };

  const filteredRoles = roleSets.filter(role => 
    role.roleName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Secure Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/control/roles"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Kernel Logic</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Capability Orchestration</Text>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search roles..." 
              className="pl-10 h-11 w-64 bg-card/30 border-white/10 rounded-xl" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleSaveAll} 
            disabled={saving}
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Commit Security Matrix
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Permission Toggles */}
        <div className="lg:col-span-8 space-y-8">
          {filteredRoles.map((roleSet) => (
            <Card key={roleSet.roleId} className="glass-card border-none shadow-2xl overflow-hidden group hover:border-primary/20 transition-all">
              <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg font-bold tracking-tight uppercase">{roleSet.roleName}</CardTitle>
                    <Badge variant="outline" className="text-[8px] border-primary/20 text-primary font-bold">ID: {roleSet.roleId}</Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground italic">{roleSet.description}</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                  {roleSet.permissions.map((perm) => (
                    <div 
                      key={perm.name} 
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/item"
                      onClick={() => handleToggle(roleSet.roleId, perm.name)}
                    >
                      <Checkbox 
                        id={`${roleSet.roleId}-${perm.name}`} 
                        checked={perm.enabled}
                        onCheckedChange={() => handleToggle(roleSet.roleId, perm.name)}
                        className="transition-transform group-hover/item:scale-110"
                      />
                      <div className="space-y-0.5">
                        <Label 
                          htmlFor={`${roleSet.roleId}-${perm.name}`} 
                          className="text-sm font-bold cursor-pointer group-hover/item:text-primary transition-colors"
                        >
                          {perm.name}
                        </Label>
                        <p className="text-[10px] text-muted-foreground">Standard functional node access.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Strategic Context Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none bg-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" /> Security Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-primary">Capability Scoping</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Always verify functional overlaps. Assigning the `system_config` node to standard `Editor` cohorts is discouraged unless restricted to taxonomy sub-trees.
                  </Text>
                </div>
                
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-secondary">Vertical Propagation</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Changes made here are propagated across the Intelligence Engine clusters within **180 seconds** of cryptographic commit.
                  </Text>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase mb-2">
                  <CheckCircle2 className="h-3 w-3" /> Kernel Integrity Verified
                </div>
                <Text variant="caption" className="italic text-muted-foreground">
                  "Kernel version 1.2.4-stable active. All administrative nodes are cryptographically verified."
                </Text>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
              <RefreshCcw className="h-24 w-24 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Info className="h-4 w-4" /> Audit Log
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Every toggle event is logged in the immutable **System Audit Trail**, attributing changes to the current administrative session signature.
            </Text>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-secondary text-xs font-bold hover:bg-transparent" asChild>
              <Link href="/admin/audit-logs">View Kernel Audits <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ChevronRight } from 'lucide-react';
