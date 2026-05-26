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
  ChevronRight,
  Zap,
  Users
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from 'next/link';
import { usersService } from '@/services/data/users-service';
import { RolePermissionSet, Permission } from '@/types/system';
import { ALL_PERMISSIONS } from '@/services/mock-api/roles';
import { toast } from '@/hooks/use-toast';

/**
 * Dynamic Permission Assignment UI.
 * Specialized control interface for orchestrating platform capabilities via an Accordion matrix.
 */
export default function DynamicPermissionAssignmentPage() {
  const [roleSets, setRoleSets] = useState<RolePermissionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const response = await usersService.getRolePermissions();
        if (response.data) setRoleSets(response.data);
      } catch (e) {
        console.error('Permission sync failure', e);
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

  const handleSaveRole = async (roleId: string) => {
    setSaving(roleId);
    
    const roleSet = roleSets.find(r => r.roleId === roleId);
    if (!roleSet) return;

    // Map labels back to IDs for the mock API
    const enabledPermissionIds = roleSet.permissions
      .filter(p => p.enabled)
      .map(p => ALL_PERMISSIONS.find(ap => ap.label === p.name)?.id)
      .filter(id => !!id) as string[];

    try {
      await usersService.assignPermissions(roleId, enabledPermissionIds);
      toast({
        title: "Capability Map Synchronized",
        description: `Functional nodes for "${roleSet.roleName}" have been committed to the security index.`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Synchronization Failure",
        description: "Failed to broadcast changes to the identity cluster.",
      });
    } finally {
      setSaving(null);
    }
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
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/control/permissions"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldAlert className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Access Engineering</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Dynamic Assignment</Text>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Least Privilege Enforced</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Assignment Accordion */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-6">
              <CardTitle className="text-lg">System Persona Matrix</CardTitle>
              <CardDescription>Expand each persona to audit and assign granular capability nodes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {roleSets.map((roleSet) => (
                  <AccordionItem key={roleSet.roleId} value={roleSet.roleId} className="border-b border-white/5 px-6">
                    <AccordionTrigger className="hover:no-underline py-6 group">
                      <div className="flex items-center gap-4 text-left">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-colors">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Text variant="body" weight="bold" className="uppercase tracking-tight">{roleSet.roleName}</Text>
                            <Badge variant="outline" className="text-[8px] border-primary/20 text-primary font-bold">ID: {roleSet.roleId}</Badge>
                          </div>
                          <Text variant="caption" className="text-muted-foreground italic line-clamp-1">{roleSet.description}</Text>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-8 animate-in slide-in-from-top-2 duration-300">
                      <div className="pt-4 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                          {roleSet.permissions.map((perm) => (
                            <div 
                              key={perm.name} 
                              className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/item"
                              onClick={() => handleToggle(roleSet.roleId, perm.name)}
                            >
                              <Checkbox 
                                id={`${roleSet.roleId}-${perm.name}`} 
                                checked={perm.enabled}
                                onCheckedChange={() => handleToggle(roleSet.roleId, perm.name)}
                                className="mt-1"
                              />
                              <div className="space-y-0.5">
                                <Label 
                                  htmlFor={`${roleSet.roleId}-${perm.name}`} 
                                  className="text-sm font-bold cursor-pointer group-hover/item:text-primary transition-colors"
                                >
                                  {perm.name}
                                </Label>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  {ALL_PERMISSIONS.find(ap => ap.label === perm.name)?.description || 'Standard capability node.'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-6 border-t border-white/5 flex justify-end">
                          <Button 
                            onClick={() => handleSaveRole(roleSet.roleId)} 
                            disabled={!!saving}
                            className="h-10 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                          >
                            {saving === roleSet.roleId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Synchronize {roleSet.roleName}
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Strategic Directives Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none bg-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                <Settings2 className="h-4 w-4" /> Security Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-primary">Granular Scoping</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Always assign capability nodes individually. Broad assignments increase the risk of lateral traversal during an audit session.
                  </Text>
                </div>
                
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-secondary">State Propagation</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Changes made to the capability map are broadcast across the Intelligence clusters within **120 seconds**.
                  </Text>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase mb-2">
                  <CheckCircle2 className="h-3 w-3" /> Matrix Integrity Verified
                </div>
                <Text variant="caption" className="italic text-muted-foreground">
                  "Current security version: 2.1.0-alpha. All administrative nodes are cryptographically signed."
                </Text>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Zap className="h-32 w-32 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Info className="h-4 w-4" /> Global Audit
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Every assignment change is logged in the **Audit Trail**, linking the functional shift to your current administrative signature.
            </Text>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-secondary text-xs font-bold hover:bg-transparent" asChild>
              <Link href="/admin/audit-logs">Review Capability Logs <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
