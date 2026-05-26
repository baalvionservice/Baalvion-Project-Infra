
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldAlert, 
  Lock, 
  CheckCircle2,
  Settings2, 
  Trash2,
  Edit,
  UserCog,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function AdminUserManagement() {
  const [users] = useState([
    { id: "USR-9921", name: "John Chen", email: "j.chen@atlasmining.com", role: "Super Admin", status: "Active", mfa: true },
    { id: "USR-9918", name: "Sara Smith", email: "sara@geotradelogistics.net", role: "Logistics", status: "Active", mfa: true },
    { id: "USR-9915", name: "Ahmed Al-Farsi", email: "ahmed@emiratesminerals.ae", role: "Buyer", status: "Suspended", mfa: false },
    { id: "USR-9910", name: "Li Wei", email: "li.wei@sinotrade.cn", role: "Finance", status: "Active", mfa: true },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <UserCog className="h-8 w-8 text-primary" aria-hidden="true" />
            Privileged Access & Roles
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Govern platform-wide administrative roles and staff permissions.</p>
        </div>
        <Button className="bg-primary text-white font-bold gap-2 h-12 px-8 shadow-lg">
          <UserPlus className="h-4 w-4" aria-hidden="true" /> Provision Admin User
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Accounts", val: "12,450", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Privileged Admins", val: "142", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "MFA Compliant", val: "98.2%", icon: Lock, color: "text-primary", bg: "bg-primary/5" },
          { label: "Access Blocks", val: "12", icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              <Input placeholder="Search staff by name, email or role..." className="pl-10 h-10 border-slate-200" aria-label="Search users" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Tiers</Button>
          </div>
        </CardHeader>
        <ScrollArea className="w-full">
          <Table aria-label="Administrative User Registry">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold min-w-[200px]">Staff Identity</TableHead>
                <TableHead className="font-bold min-w-[120px]">System Role</TableHead>
                <TableHead className="font-bold min-w-[100px]">Status</TableHead>
                <TableHead className="font-bold min-w-[120px]">MFA Security</TableHead>
                <TableHead className="text-right font-bold min-w-[150px]">Governance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 border group-hover:border-primary/20 transition-colors" aria-hidden="true">
                        {user.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{user.name}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5",
                      user.role === "Super Admin" ? "bg-primary text-white border-none" : "border-slate-200"
                    )}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[10px] font-bold px-2 py-0.5",
                      user.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )} aria-label={`Status: ${user.status}`}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      {user.mfa ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold uppercase text-[9px] tracking-tighter"><Lock className="h-3 w-3" aria-hidden="true" /> FIDO2 Verified</span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1 font-bold uppercase text-[9px] tracking-tighter"><ShieldAlert className="h-3 w-3" aria-hidden="true" /> Password Only</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-primary font-bold gap-2" aria-label={`Edit permissions for ${user.name}`}>
                            <Edit className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">RBAC Matrix</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                              <Settings2 className="h-6 w-6 text-primary" aria-hidden="true" />
                              Staff Permissions Matrix: {user.name}
                            </DialogTitle>
                            <CardDescription>Assign modular access scopes for this administrative account.</CardDescription>
                          </DialogHeader>
                          
                          <ScrollArea className="max-h-[60vh] py-6 border-y my-4 pr-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {[
                                { label: "Financial Governance", desc: "Escrow release, fee configuration, revenue ledger." },
                                { label: "Compliance Authority", desc: "License audit, KYC sign-off, border rule editing." },
                                { label: "Template Architect", desc: "Modify PDF strategy and email automation content." },
                                { label: "System Orchestrator", desc: "Manage staff roles, API keys, and global scale policy." },
                                { label: "Fraud Sentinel", desc: "Investigate anomalies, suspend accounts, delete listings." },
                                { label: "BI Intelligence", desc: "Access high-level analytics and custom audit reports." },
                              ].map((perm, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border group hover:border-primary/20 transition-colors">
                                  <Checkbox id={`perm-${idx}`} className="mt-1" defaultChecked={user.role === "Super Admin" || idx < 2} disabled={user.role === "Super Admin"} />
                                  <div className="space-y-0.5">
                                    <label htmlFor={`perm-${idx}`} className="text-sm font-bold text-slate-900 cursor-pointer">{perm.label}</label>
                                    <p className="text-[10px] text-slate-500 leading-tight">{perm.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>

                          <DialogFooter className="sm:justify-between gap-4">
                            <p className="text-[10px] text-slate-500 italic max-w-xs text-center sm:text-left">Changes are recorded in the Global Audit Ledger and require secondary sign-off for Super Admin roles.</p>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button variant="outline" className="flex-1 sm:flex-none font-bold">Cancel</Button>
                              <Button className="flex-1 sm:flex-none bg-primary font-bold px-8">Sync RBAC Access</Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500" aria-label={`Delete user ${user.name}`}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>
    </div>
  );
}
