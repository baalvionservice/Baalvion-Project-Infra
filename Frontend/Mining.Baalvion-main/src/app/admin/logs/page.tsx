
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  User, 
  ShieldCheck, 
  Server, 
  Globe,
  Settings2,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [logs] = useState([
    { id: "LOG-1021", actor: "Admin_04", action: "VERIFY_COMPANY", entity: "Atlas Mining Co", timestamp: "2024-05-18 10:42 AM", ip: "192.168.1.42", type: "COMPLIANCE" },
    { id: "LOG-1020", actor: "System_AI", action: "BLOCK_IP", entity: "104.22.8.12", timestamp: "2024-05-18 10:15 AM", ip: "Internal", type: "SECURITY" },
    { id: "LOG-1019", actor: "Admin_01", action: "UPDATE_FEES", entity: "Platform treasury", timestamp: "2024-05-18 09:30 AM", ip: "192.168.1.12", type: "FINANCE" },
    { id: "LOG-1018", actor: "Support_02", action: "RESOLVE_DISPUTE", entity: "DSP-1001", timestamp: "2024-05-18 08:45 AM", ip: "192.168.1.88", type: "SUPPORT" },
    { id: "LOG-1017", actor: "Admin_04", action: "DELETE_LISTING", entity: "LST-882", timestamp: "2024-05-17 11:20 PM", ip: "192.168.1.42", type: "CONTENT" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Global Audit Logs
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Immutable time-stamped history of all administrative and system actions.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <Download className="h-4 w-4" /> Export Ledger (CSV)
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-xs font-bold uppercase">
            <Server className="h-4 w-4" />
            Ledger Verified
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search Logs by Actor, Action, or IP..." className="pl-10 h-10 border-slate-200" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Log Types</Button>
          <div className="h-8 w-px bg-slate-200" />
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase text-[9px] tracking-widest px-3 py-1">
            Integrity Guard Active
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="font-bold">Log ID</TableHead>
              <TableHead className="font-bold">Actor</TableHead>
              <TableHead className="font-bold">Action Performed</TableHead>
              <TableHead className="font-bold">Target Entity</TableHead>
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Timestamp</TableHead>
              <TableHead className="text-right font-bold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                <TableCell className="font-mono text-[10px] font-bold text-slate-400">{log.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/10">
                      {log.actor[0]}
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{log.actor}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{log.action}</span>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-700">{log.entity}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold uppercase tracking-widest",
                    log.type === "SECURITY" ? "border-rose-200 text-rose-700 bg-rose-50" : 
                    log.type === "COMPLIANCE" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                    "border-slate-200 text-slate-600 bg-slate-50"
                  )}>
                    {log.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-[10px] text-slate-500 font-medium">{log.timestamp}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="p-6 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
        <div className="absolute left-0 bottom-0 opacity-10 p-4">
          <ShieldCheck className="h-32 w-32" />
        </div>
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <h3 className="text-lg font-bold">Ledger Integrity Proof</h3>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            The Baalvion Mining Inc. audit log utilizes cryptographic hashing to ensure that no log entry can be modified or deleted once created. This ledger is synchronized across geographically distributed secure platform nodes.
          </p>
        </div>
        <div className="flex gap-4 relative z-10 shrink-0">
          <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-xs">Verify Sequence</Button>
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-8">System Audit Report</Button>
        </div>
      </div>
    </div>
  );
}
