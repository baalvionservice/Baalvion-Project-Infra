
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AuditLogEntry, UserRole, ModuleName } from "@/core/content/schemas";
import { auditService } from "@/core/services/audit.service";
import { Search, Shield, Clock, Filter, Calendar } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  const loadLogs = async () => {
    const data = await auditService.getLogs();
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
    window.addEventListener('audit-updated', loadLogs);
    return () => window.removeEventListener('audit-updated', loadLogs);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.action.toLowerCase().includes(search.toLowerCase()) ||
                           l.module.toLowerCase().includes(search.toLowerCase()) ||
                           l.userRole.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || l.userRole === roleFilter;
      const matchesModule = moduleFilter === 'all' || l.module === moduleFilter;
      
      return matchesSearch && matchesRole && matchesModule;
    });
  }, [logs, search, roleFilter, moduleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-4 bg-card/30 p-4 border border-border/50 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search ledger actions..." 
            className="pl-10 bg-background border-border/50 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-10 bg-background">
              <Filter className="h-3 w-3 mr-2 opacity-50" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">GP Admin</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="phase1">Investor</SelectItem>
            </SelectContent>
          </Select>

          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-10 bg-background">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="Reporting">Reporting</SelectItem>
              <SelectItem value="Workflow">Workflow</SelectItem>
              <SelectItem value="Notifications">Alerts</SelectItem>
              <SelectItem value="Voting">Voting</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/30 border-border/50">
        <CardHeader className="border-b border-border/50 bg-background/50">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Immutable System Ledger
              </CardTitle>
              <CardDescription>Comprehensive record of all administrative and governance tranches.</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px]">{filteredLogs.length} Entries</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest pl-6">Timestamp</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Role</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Module</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Action</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-6">Target ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-border/50 group hover:bg-primary/5 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter border-primary/20 bg-primary/5 text-primary">
                      {log.userRole}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{log.module}</TableCell>
                  <TableCell>
                    <span className="text-xs font-bold capitalize text-foreground/80">{log.action}</span>
                  </TableCell>
                  <TableCell className="text-right pr-6 text-[10px] font-mono text-muted-foreground">
                    {log.entityId}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-muted-foreground text-xs italic">
                    No matching ledger entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
