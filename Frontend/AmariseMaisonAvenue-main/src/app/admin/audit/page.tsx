'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  History, 
  Search, 
  Download, 
  ChevronRight, 
  Lock, 
  Activity, 
  Eye, 
  FileText, 
  Database,
  ArrowRight,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Terminal,
  Zap,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadMockAuditReport } from '@/lib/audit/engine';

/**
 * Layer 4: Action Ledger & Institutional Compliance Node.
 * High-fidelity action tracking with state delta inspection.
 */
export default function AuditCommandHub() {
  const { scopedAuditLogs, currentUser } = useAppStore();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLog = scopedAuditLogs.find(l => l.id === selectedLogId);

  const filteredLogs = scopedAuditLogs.filter(l => 
    (l.actorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.entity || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-fade-in font-body">
      {/* State Delta Inspector Modal */}
      <Dialog open={!!selectedLogId} onOpenChange={() => setSelectedLogId(null)}>
        <DialogContent className="max-w-4xl bg-[#0A0A0B] border-white/5 text-white p-0 overflow-hidden shadow-2xl rounded-none">
           {selectedLog && (
             <div className="flex flex-col h-[80vh]">
                <header className="p-8 border-b border-white/5 bg-white/[0.02]">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <Badge variant="outline" className={cn("text-[8px] uppercase tracking-widest border-none px-3 py-1", 
                           selectedLog.severity === 'high' ? 'bg-red-500 text-white' : 'bg-blue-500/10 text-blue-400'
                         )}>
                            {selectedLog.severity} Severity Event
                         </Badge>
                         <DialogTitle className="text-3xl font-headline font-bold italic pt-2">{selectedLog.action}</DialogTitle>
                         <p className="text-[10px] text-white/40 uppercase tracking-widest">Actor: {selectedLog.actorName} ({selectedLog.actorRole}) • {new Date(selectedLog.timestamp).toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedLogId(null)} className="text-white/20 hover:text-white"><XCircle size={20} /></Button>
                   </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <div className="flex items-center space-x-2 text-white/30">
                            <ArrowLeft size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Before State</span>
                         </div>
                         <pre className="p-6 bg-white/5 border border-white/5 text-[10px] font-mono text-white/60 overflow-x-auto h-[400px]">
                            {JSON.stringify(selectedLog.beforeState || { msg: 'Initial creation event' }, null, 2)}
                         </pre>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center space-x-2 text-blue-400">
                            <ArrowRight size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">After State</span>
                         </div>
                         <pre className="p-6 bg-blue-500/5 border border-blue-500/10 text-[10px] font-mono text-white/80 overflow-x-auto h-[400px]">
                            {JSON.stringify(selectedLog.afterState || { msg: 'Current registry state' }, null, 2)}
                         </pre>
                      </div>
                   </div>

                   {selectedLog.reason && (
                     <div className="p-6 bg-white/5 border-l-4 border-l-plum">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-plum mb-2">Institutional Rationale</p>
                        <p className="text-sm italic font-light text-white/80">"{selectedLog.reason}"</p>
                     </div>
                   )}
                </main>

                <footer className="p-8 border-t border-white/5 bg-black flex justify-end">
                   <Button className="h-12 px-10 rounded-none bg-white text-black hover:bg-plum hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all">
                      DOWNLOAD COMPLIANCE FRAGMENT
                   </Button>
                </footer>
             </div>
           )}
        </DialogContent>
      </Dialog>

      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-emerald-500">
             <ShieldCheck className="w-5 h-5" />
             <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Tactical Layer 4</span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            Action Ledger
          </h1>
          <p className="text-sm text-white/40 font-light italic">Immutable record of global Maison actions and state mutations.</p>
        </div>
        <div className="flex items-center space-x-4">
           <Button className="h-14 px-10 rounded-none bg-white text-black hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl" onClick={() => downloadMockAuditReport(scopedAuditLogs)}>
             <Download className="w-4 h-4 mr-3" /> EXPORT COMPLIANCE ARCHIVE
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         <div className="lg:col-span-8 space-y-8">
            <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden rounded-none">
               <CardHeader className="border-b border-white/5 bg-white/5 flex flex-row items-center justify-between p-8">
                  <div>
                     <CardTitle className="font-headline text-2xl text-white">Institutional Registry</CardTitle>
                     <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Append-only log of tactical node mutations</CardDescription>
                  </div>
                  <div className="relative group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-blue-400" />
                     <input 
                      className="bg-white/5 border border-white/10 h-10 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none w-64 text-white focus:border-blue-500 transition-all" 
                      placeholder="FILTER LEDGER..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                     />
                  </div>
               </CardHeader>
               <Table>
                  <TableHeader className="bg-white/5">
                     <TableRow className="border-white/5">
                        <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Timestamp</TableHead>
                        <TableHead className="text-[9px] uppercase font-bold text-white/40">Actor</TableHead>
                        <TableHead className="text-[9px] uppercase font-bold text-white/40">Resource</TableHead>
                        <TableHead className="text-[9px] uppercase font-bold text-white/40">Action Descriptor</TableHead>
                        <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Delta</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredLogs.map(log => (
                       <TableRow key={log.id} className="hover:bg-white/5 transition-colors border-white/5 h-16 group" onClick={() => setSelectedLogId(log.id)}>
                          <TableCell className="pl-8 text-[10px] font-mono text-white/20">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-white/80 uppercase">{log.actorName}</span>
                                <span className="text-[8px] text-white/20 uppercase tracking-widest">{log.actorRole} • {(log.country || '').toUpperCase()}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <Badge variant="outline" className="text-[7px] border-white/10 text-plum uppercase">{log.entity}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-light italic text-white/60">"{(log.action || '').replace('_', ' ')}"</TableCell>
                          <TableCell className="text-right pr-8">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 group-hover:text-blue-400 group-hover:bg-blue-500/5 transition-all">
                                <Terminal size={14} />
                             </Button>
                          </TableCell>
                       </TableRow>
                     ))}
                     {filteredLogs.length === 0 && (
                       <TableRow>
                          <TableCell colSpan={5} className="py-40 text-center opacity-20">
                             <FileText className="w-12 h-12 mx-auto mb-4" />
                             <p className="text-[10px] font-bold uppercase tracking-widest">Audit matrix clear</p>
                          </TableCell>
                       </TableRow>
                     )}
                  </TableBody>
               </Table>
            </Card>
         </div>

         <aside className="lg:col-span-4 space-y-8">
            <Card className="bg-black text-white p-10 space-y-10 shadow-2xl relative overflow-hidden rounded-none border-none">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                  <Lock className="w-40 h-40 text-emerald-500" />
               </div>
               <div className="relative z-10 space-y-6">
                  <h3 className="text-3xl font-headline font-bold italic tracking-tight leading-none uppercase">Trust Registry</h3>
                  <p className="text-sm font-light italic text-white/60 leading-relaxed">
                    "Institutional accountability requires absolute transparency. Every state mutation is verified against the Maison Core and signed into the immutable ledger."
                  </p>
                  <div className="space-y-6 pt-6 border-t border-white/10">
                     <PolicyStat label="RBAC Compliance" val="100%" />
                     <PolicyStat label="Audit Velocity" val="12ms" />
                     <PolicyStat label="Retention Integrity" val="Immutable" />
                  </div>
                  <Button variant="outline" className="w-full rounded-none border-emerald-900/40 text-emerald-400 hover:bg-emerald-500 hover:text-white text-[9px] font-bold uppercase tracking-widest h-12 transition-all">
                     ACTIVATE SECURITY FLUSH
                  </Button>
               </div>
            </Card>

            <div className="p-8 border border-white/5 bg-[#111113] space-y-6 rounded-none">
               <div className="flex items-center space-x-3 text-blue-400">
                  <Zap className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Real-time Tracing</h4>
               </div>
               <p className="text-[10px] text-white/40 italic leading-relaxed">
                 "Live session monitoring is active across 5 jurisdictions. Any unauthorized override will trigger an institutional block."
               </p>
            </div>
         </aside>
      </div>
    </div>
  );
}

function PolicyStat({ label, val }: { label: string, val: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2 group">
       <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">{label}</span>
       <span className="text-sm font-bold text-white tabular uppercase">{val}</span>
    </div>
  );
}
