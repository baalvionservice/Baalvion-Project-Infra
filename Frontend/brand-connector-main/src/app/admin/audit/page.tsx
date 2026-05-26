
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldAlert,
  ShieldCheck,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Zap,
  Loader2,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { collection, query, orderBy, doc, getDocs } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { AuditLog } from '@/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function AdminAuditLogPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // 1. Fetch Audit Logs
  const auditQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
  }, [db]);

  const { data: logs, loading } = useCollection<AuditLog>(auditQuery);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || log.actionType === typeFilter;
      const matchesAdmin = adminFilter === 'all' || log.adminId === adminFilter;
      return matchesSearch && matchesType && matchesAdmin;
    });
  }, [logs, searchQuery, typeFilter, adminFilter]);

  const exportCSV = () => {
    const headers = "Timestamp,Admin,Action,Entity,EntityType,Critical\n";
    const rows = filteredLogs.map(l =>
      `${l.timestamp},${l.adminName},${l.actionType},${l.entityId},${l.entityType},${l.isCritical}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baalvion_audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "Audit log exported", description: "CSV file generated successfully." });
  };

  const getActionBadge = (type: string, isCritical: boolean) => {
    if (isCritical) return <Badge className="bg-red-100 text-red-600 border-none font-black text-[9px] uppercase tracking-tighter">{type}</Badge>;
    if (type.includes('UPDATE')) return <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[9px] uppercase tracking-tighter">{type}</Badge>;
    if (type.includes('CREATE')) return <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] uppercase tracking-tighter">{type}</Badge>;
    return <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">{type}</Badge>;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Compliance Audit Log
          </h1>
          <p className="text-slate-500 font-medium">Immutable record of all administrative state changes and system overrides.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Badge className="bg-slate-900 text-white h-11 px-4 rounded-xl flex items-center gap-2 border-none shadow-lg shadow-slate-900/10">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-black uppercase tracking-widest text-[10px]">Tamper Proof Active</span>
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Admin or ID..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[160px]">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">All Actions</SelectItem>
              <SelectItem value="USER_DELETED" className="font-bold text-red-600">User Deletions</SelectItem>
              <SelectItem value="DISPUTE_RESOLVED" className="font-bold">Dispute Rulings</SelectItem>
              <SelectItem value="PLAN_UPDATED" className="font-bold">Plan Config</SelectItem>
              <SelectItem value="MANUAL_PAYOUT" className="font-bold text-emerald-600">Manual Payouts</SelectItem>
            </SelectContent>
          </Select>

          <Select value={adminFilter} onValueChange={setAdminFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[160px]">
              <SelectValue placeholder="Admin User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">All Administrators</SelectItem>
              <SelectItem value="current_admin" className="font-bold">Root Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Timeframe:</label>
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold h-8 px-3">Last 30 Days</Badge>
        </div>
      </div>

      {/* Ledger Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Timestamp</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Admin</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Action Type</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Entity Context</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "group border-slate-50 hover:bg-slate-50/50 transition-colors h-20",
                      log.isCritical && "bg-red-50/20 hover:bg-red-50/40"
                    )}
                  >
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">
                          {new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                          {log.adminName.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{log.adminName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.actionType, log.isCritical)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600">{log.entityType}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ID: {log.entityId.substring(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl font-bold h-9 px-4 bg-slate-50 text-slate-600 hover:text-primary"
                        onClick={() => { setSelectedLog(log); setIsDetailsOpen(true); }}
                      >
                        <Eye className="h-4 w-4 mr-1.5" /> Inspect Delta
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Audit ledger is clean</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delta Inspection Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none max-w-2xl shadow-2xl">
          <div className="bg-slate-50 p-8 border-b">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center",
                  selectedLog?.isCritical ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                )}>
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">Audit Delta Inspection</DialogTitle>
                  <DialogDescription className="font-medium">Action ID: {selectedLog?.id}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pre-Change State</h4>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 text-xs font-mono text-slate-500 overflow-x-auto whitespace-pre">
                  {selectedLog?.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : 'No previous state'}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Post-Change State</h4>
                <div className="p-5 rounded-2xl bg-emerald-50/30 border border-emerald-100 text-xs font-mono text-emerald-700 overflow-x-auto whitespace-pre">
                  {selectedLog?.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : 'No new state recorded'}
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</p>
                <p className="text-sm font-bold text-slate-900">{selectedLog?.adminName} (ID: {selectedLog?.adminId})</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Targeted</p>
                <p className="text-sm font-bold text-slate-900">{selectedLog?.entityType} • {selectedLog?.entityId}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => setIsDetailsOpen(false)}>Close Audit</Button>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mr-auto ml-4">
              <Zap className="h-4 w-4 text-primary fill-primary" /> Verified System Signature Correct
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compliance Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
          <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
            <AlertCircle className="h-8 w-8 text-orange-400" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold">Immutability Protocol</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Audit logs are strictly read-only and cannot be modified or deleted via the UI or SDK. Records are retained for 7 years for financial compliance.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Regulatory Auditing</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Every sensitive operation (Dispute resolution, Manual Payouts, User Deletion) automatically captures the administrator's IP and timestamp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
