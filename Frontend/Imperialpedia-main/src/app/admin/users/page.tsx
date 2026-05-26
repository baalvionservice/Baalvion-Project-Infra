"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import {
  Users,
  ShieldCheck,
  Search,
  ChevronRight,
  Activity,
  Lock,
  Loader2,
  Settings2,
  Key,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminKernel } from "@/lib/services/admin-service";
import { AdminUser, AdminRole } from "@/types/admin-system";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UserRBACManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setUsers(adminKernel.getUsers());
    setLoading(false);
  }, []);

  const handleRoleChange = (userId: string, role: AdminRole) => {
    adminKernel.updateUserRole(userId, role);
    setUsers(adminKernel.getUsers());
    toast({
      title: "Persona Updated",
      description: `User migrated to ${role} node.`,
    });
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading)
    return (
      <div className="py-40 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Lock className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Identity Orchestration
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            User & Role Hub
          </Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            RBAC Matrix Active
          </span>
        </div>
      </header>

      <div className="bg-card/30 p-4 rounded-2xl border border-white/5 flex items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search identity registry..."
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                  User Node
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Email Node
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Assigned Persona
                </TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                  Last Active
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow
                  key={user.id}
                  className="group hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-foreground/90">
                        {user.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Select
                        value={user.role}
                        onValueChange={(val: any) =>
                          handleRoleChange(user.id, val)
                        }
                      >
                        <SelectTrigger className="w-[160px] h-9 text-[10px] font-bold uppercase tracking-widest bg-background/50 border-white/5 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Super Admin">
                            Super Admin
                          </SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Editor">Editor</SelectItem>
                          <SelectItem value="Writer">Writer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {user.lastActive}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <Text
              variant="bodySmall"
              weight="bold"
              className="text-primary uppercase tracking-widest text-[10px]"
            >
              Permission Matrix
            </Text>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />{" "}
                <strong>Super Admin:</strong> Full Platform Orchestration
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />{" "}
                <strong>Editor:</strong> Triage & Publication Approval
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />{" "}
                <strong>Writer:</strong> Drafting & Metadata Node Creation
              </li>
            </ul>
          </div>
        </Card>

        <Card className="glass-card border-none bg-secondary/5 p-8 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <ShieldCheck className="h-24 w-24 text-secondary" />
          </div>
          <Text variant="h3" className="font-bold">
            Least Privilege Matrix
          </Text>
          <Text
            variant="caption"
            className="text-muted-foreground mt-2 leading-relaxed"
          >
            The Imperialpedia kernel enforces **Least Privilege** protocols.
            Every role shift is logged in the immutable Audit Trail.
          </Text>
          <Button
            variant="link"
            className="mt-4 p-0 h-auto text-secondary font-bold text-xs uppercase w-fit group/link"
            asChild
          >
            <Link href="/admin/dashboard">
              Access Security Logs{" "}
              <ChevronRight
                size={12}
                className="transition-transform group-hover/link:translate-x-1"
              />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
