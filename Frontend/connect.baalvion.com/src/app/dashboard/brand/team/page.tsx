
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  ShieldCheck, 
  Loader2, 
  Mail, 
  Clock, 
  CheckCircle2, 
  MoreHorizontal,
  Plus,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { useTeamStore } from '@/store/useTeamStore';
import { hasPermission } from '@/lib/permissions';
import { TeamRole } from '@/types/team';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function TeamManagementPage() {
  const { members, loading, currentUserRole, fetchTeam, inviteMember, updateRole, removeMember } = useTeamStore();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('manager');

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async () => {
    await inviteMember(inviteEmail, inviteRole);
    toast({ title: "Invitation Sent", description: `${inviteEmail} has been added to the queue.` });
    setIsInviteOpen(false);
    setInviteEmail('');
  };

  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const canManageTeam = hasPermission(currentUserRole, 'team', 'create');

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Team Workspace</h1>
          <p className="text-slate-500 font-medium">Manage collaborators and access levels for your brand account.</p>
        </div>
        <div className="flex items-center gap-3">
          {canManageTeam && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Invite Team Member</DialogTitle>
                  <DialogDescription>Assign a role to define their access to the platform.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label className="font-bold">Work Email</Label>
                    <Input 
                      placeholder="name@company.com" 
                      className="h-12 rounded-xl"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Role</Label>
                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin" className="font-bold">Admin (Full Access)</SelectItem>
                        <SelectItem value="manager" className="font-bold">Manager (Projects Only)</SelectItem>
                        <SelectItem value="viewer" className="font-bold">Viewer (Read-only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleInvite} className="w-full h-14 rounded-2xl font-black text-lg">Send Invitation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search members..." 
                  className="pl-10 h-10 rounded-xl bg-white border-none shadow-inner"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Badge variant="secondary" className="font-bold">{members.length} Total</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/30" /></div>
                ) : filtered.map((member) => (
                  <div key={member.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-xl border border-white shadow-sm">
                        <AvatarFallback className="bg-primary/5 text-primary font-black uppercase">{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-slate-900">{member.name}</h4>
                        <p className="text-xs text-slate-400 font-medium">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Badge className={cn(
                        "uppercase text-[10px] font-black h-6 px-3 border-none",
                        member.role === 'admin' ? "bg-slate-900 text-white" : member.role === 'manager' ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {member.role}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "uppercase text-[8px] font-black",
                        member.status === 'invited' ? "text-orange-500 border-orange-200" : "text-emerald-500 border-emerald-200"
                      )}>
                        {member.status}
                      </Badge>
                      {canManageTeam && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-none shadow-2xl">
                            <DropdownMenuLabel>Permissions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateRole(member.id, 'admin')} className="rounded-lg font-bold">Set as Admin</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRole(member.id, 'manager')} className="rounded-lg font-bold">Set as Manager</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRole(member.id, 'viewer')} className="rounded-lg font-bold">Set as Viewer</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => removeMember(member.id)} className="rounded-lg font-bold text-red-600">Remove from Team</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Access Control</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Roles define exactly what your team can see and do. Adhere to the principle of least privilege for maximum workspace security.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>Organization: Lumina Tech</span>
                  <span className="text-emerald-400">Owner Status</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Security Policy</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                All team actions including invitations and role changes are recorded in the immutable audit log for compliance.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
