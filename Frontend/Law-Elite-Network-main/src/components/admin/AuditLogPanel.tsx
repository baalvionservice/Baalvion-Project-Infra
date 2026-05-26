"use client";

import React, { useEffect, useState } from "react";
import { getAuditLogs } from "@/services/audit/auditService";
import { AuditLog, AuditAction } from "@/types/audit";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ShieldCheck, 
  Loader2, 
  History, 
  User, 
  Briefcase, 
  CalendarClock, 
  MessageSquare, 
  FileUp, 
  Search,
  FilterX
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

/**
 * @fileOverview AuditLogPanel
 * High-fidelity system monitoring interface for platform administrators.
 */
export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<any>({
    action: "all",
    userId: ""
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const activeFilters: any = {};
      if (filter.action !== "all") activeFilters.action = filter.action;
      if (filter.userId) activeFilters.userId = filter.userId;

      const data = await getAuditLogs(activeFilters);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filter.action]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case "create_case": return <Briefcase className="w-3.5 h-3.5 text-emerald-600" />;
      case "book_appointment": return <CalendarClock className="w-3.5 h-3.5 text-amber-600" />;
      case "send_message": return <MessageSquare className="w-3.5 h-3.5 text-purple-600" />;
      case "upload_document": return <FileUp className="w-3.5 h-3.5 text-cyan-600" />;
      case "delete_case": return <History className="w-3.5 h-3.5 text-red-600" />;
      default: return <History className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl italic text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-600" /> Intelligence Audit
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-1">Immutable ledger of global network actions.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input 
              placeholder="Search Member ID..." 
              value={filter.userId}
              onChange={(e) => setFilter({...filter, userId: e.target.value})}
              className="h-10 border-slate-200 w-48 text-[10px] uppercase font-bold tracking-widest bg-white"
            />
            <Button type="submit" size="icon" className="bg-[#0B1F3A] h-10 w-10 rounded-xl">
              <Search className="w-4 h-4 text-white" />
            </Button>
          </form>

          <Select value={filter.action} onValueChange={(val) => setFilter({...filter, action: val})}>
            <SelectTrigger className="h-10 w-48 border-slate-200 text-[10px] uppercase font-bold tracking-widest bg-white">
              <SelectValue placeholder="Action Protocol" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 bg-white">
              <SelectItem value="all">All Protocols</SelectItem>
              <SelectItem value="create_case">Matter Creation</SelectItem>
              <SelectItem value="book_appointment">Appointment Committed</SelectItem>
              <SelectItem value="send_message">Secure Broadcast</SelectItem>
              <SelectItem value="upload_document">Vault Uplink</SelectItem>
              <SelectItem value="delete_case">Matter Termination</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => { setFilter({action: "all", userId: ""}); }}
            className="h-10 border-slate-200 text-[10px] uppercase font-bold tracking-widest px-4 bg-white"
          >
            <FilterX className="w-3.5 h-3.5 mr-2" /> Reset
          </Button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-50" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Synchronizing Event Ledger...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-32 text-center">
            <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-sm italic text-slate-400 uppercase tracking-widest">No audit signals found matching criteria.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Action Protocol</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Target Entity</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Authorized Member</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Metadata Details</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Synchronization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50 border-slate-50 group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        {getActionIcon(log.action)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-[8px] uppercase tracking-tighter py-0.5 px-2 font-bold text-slate-600">
                      {log.entityType}: {log.entityId.slice(-6)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-blue-600/50" />
                        <span className="text-[10px] font-bold text-slate-900 uppercase">{log.userId.slice(-8)}</span>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-4.5">{log.userRole}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[10px] text-slate-500 italic truncate max-w-[200px]">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt))} ago
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
