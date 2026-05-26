'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  RotateCcw
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { usersService } from '@/services/data/users-service';
import { RoleControl } from '@/types/system';
import { ALL_PERMISSIONS } from '@/services/mock-api/roles';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

/**
 * Role Governance & Persona Architect.
 * Specialized suite for defining system capabilities and access boundaries.
 */
export default function RoleControlMatrixPage() {
  const [roles, setRoles] = useState<RoleControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleControl | null>(null);

  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await usersService.getControlRoles();
        if (response.data) setRoles(response.data);
      } catch (e) {
        console.error('Role matrix sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  const filteredRoles = roles.filter(role => 
    role.roleName.toLowerCase().includes(search.toLowerCase())
  );

  const handleTogglePermission = (permissionId: string) => {
    if (!currentRole) return;
    
    const hasPermission = currentRole.permissions.includes(permissionId);
    const updatedPermissions = hasPermission
      ? currentRole.permissions.filter(p => p !== permissionId)
      : [...currentRole.permissions, permissionId];
      
    setCurrentRole({ ...currentRole, permissions: updatedPermissions });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole) return;

    // Simulate persistence logic
    setRoles(prev => prev.map(r => r.id === currentRole.id ? currentRole : r));
    
    toast({
      title: "Persona Synchronized",
      description: `Access parameters for "${currentRole.roleName}" have been pushed to the security index.`,
    });
    setIsEditing(false);
  };

  const handleDelete = (id: string, name: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Role Purged",
      description: `Persona "${name}" has been removed from the governance buffer.`,
      variant: "destructive"
    });
  };

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
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Role Governance</Text>
          </div>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 shadow-xl shadow-primary/20 font-bold transition-all scale-105 active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Architect New Persona
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-20 z-30">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search roles by label or capability node..." 
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs" asChild>
          <Link href="/admin/control/audit-trail">
            <ShieldAlert className="h-4 w-4 text-primary" /> View Security Log
          </Link>
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Persona Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Identity Nodes</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Active Capability Matrix</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Governance Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Retrieving Access Matrix...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground italic">
                    No matching roles localized in current governance buffer.
                  </TableCell>
                </TableRow>
              ) : filteredRoles.map((role) => (
                <TableRow key={role.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-6 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold uppercase tracking-tight block group-hover:text-primary transition-colors">{role.roleName}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">ID: {role.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold">{role.usersAssigned.toLocaleString()}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Nodes</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map(p => (
                        <Badge key={p} variant="secondary" className="bg-primary/5 text-primary border-none text-[8px] font-bold uppercase py-0.5 px-2 h-5">
                          {p.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 px-4 text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all rounded-xl"
                        onClick={() => {
                          setCurrentRole(role);
                          setIsEditing(true);
                        }}
                      >
                        <Settings2 className="h-3.5 w-3.5" /> Refine Matrix
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors rounded-xl"
                        onClick={() => handleDelete(role.id, role.roleName)}
                      >
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

      {/* Governance Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4 group">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary group-hover:scale-110 transition-transform">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Principle of Least Privilege</Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Capabilities are denied by default. Only explicitly enabled nodes in the Persona Architect will allow vertical traversal of platform functions.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <RotateCcw className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Audited Sync Cycle</Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Every modification to the Persona Matrix is cryptographically sealed and logged in the immutable **Audit Trail** for compliance oversight.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-emerald-500/20 p-8 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 w-fit text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Inheritance Engine</Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Personas utilizing high-impact nodes are automatically subjected to mandatory biometric MFA challenges during active administrative sessions.
            </Text>
          </div>
        </Card>
      </div>

      {/* Role Configuration Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-white/10 p-0 overflow-hidden">
          <form onSubmit={handleSave}>
            <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3">
                  Persona Architect
                </Badge>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase">Security Sealed</span>
                </div>
              </div>
              <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                <Settings2 className="h-8 w-8 text-primary" /> 
                Refine Persona: {currentRole?.roleName}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2">
                Configure the specific capability nodes for this system persona.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-white/5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role Label</Label>
                  <Input 
                    value={currentRole?.roleName || ''} 
                    onChange={(e) => setCurrentRole(prev => prev ? { ...prev, roleName: e.target.value } : null)}
                    placeholder="e.g. Moderator" 
                    className="bg-background/50 border-white/5 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Internal Narrative</Label>
                  <Input 
                    value={currentRole?.description || ''} 
                    onChange={(e) => setCurrentRole(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Briefly explain this role's purpose..." 
                    className="bg-background/50 border-white/5 h-12"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                    <ShieldAlert className="h-4 w-4" /> Capability Node Matrix
                  </div>
                  <Button type="button" variant="ghost" className="text-[10px] font-bold text-muted-foreground hover:text-primary" onClick={() => setCurrentRole(prev => prev ? {...prev, permissions: ALL_PERMISSIONS.map(p => p.id)} : null)}>
                    Assign All Nodes
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ALL_PERMISSIONS.map((perm) => (
                    <div 
                      key={perm.id} 
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-white/5 ${
                        currentRole?.permissions.includes(perm.id) 
                          ? 'border-primary/40 bg-primary/5 shadow-inner' 
                          : 'border-white/5 bg-background/30'
                      }`}
                      onClick={() => handleTogglePermission(perm.id)}
                    >
                      <Checkbox 
                        id={perm.id} 
                        checked={currentRole?.permissions.includes(perm.id)}
                        onCheckedChange={() => handleTogglePermission(perm.id)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor={perm.id} className="text-sm font-bold cursor-pointer transition-colors group-hover:text-primary">{perm.label}</Label>
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="h-12 px-6 rounded-xl font-bold">Discard Shifts</Button>
              <Button type="submit" className="h-12 px-10 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all">
                Synchronize Persona
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
