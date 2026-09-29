"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  LifeBuoy, 
  MessageSquare, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/**
 * @fileOverview SupportCenter
 * Command hub for managing member inquiries and professional assistance requests.
 */
export default function SupportCenter() {
  const [tickets] = useState([
    { id: "TKT_102", member: "Jonathan Edwards", role: "Client", issue: "Dossier Uplink Failure", status: "Critical", time: "2h ago" },
    { id: "TKT_103", member: "Priya Mehta", role: "Lawyer", issue: "Settlement Verification", status: "Active", time: "4h ago" },
    { id: "TKT_104", member: "Alex Williams", role: "Client", issue: "Counsel Matching Logic", status: "Pending", time: "1d ago" },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl italic text-slate-900 flex items-center gap-3">
            <LifeBuoy className="w-6 h-6 text-amber-500" /> Network Concierge Hub
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-1">Resolution protocol for member inquiries and strategic disputes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search Ticket ID..." className="pl-10 h-10 border-slate-200 w-48 text-[10px] uppercase font-bold" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100">
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Ticket Identification</TableHead>
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Member Dossier</TableHead>
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Inquiry Scope</TableHead>
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Intensity</TableHead>
                  <TableHead className="text-right text-[9px] font-bold uppercase tracking-widest text-slate-500">Protocol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50 border-slate-50 group">
                    <TableCell>
                      <span className="font-mono text-[10px] font-bold text-slate-900">{t.id}</span>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{t.time}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-900">{t.member}</p>
                          <p className="text-[8px] font-bold text-blue-600 uppercase tracking-tighter">{t.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-slate-600 italic">"{t.issue}"</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[8px] uppercase font-bold border-none shadow-none ${
                        t.status === 'Critical' ? 'bg-red-50 text-red-600' : 
                        t.status === 'Active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50">
                        Engage <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-4 flex items-center gap-2">
              <LifeBuoy className="w-3.5 h-3.5" /> Resolution Pulse
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                <span className="text-slate-500">Average Latency:</span>
                <span className="text-slate-900">42m</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                <span className="text-slate-500">Solved (24h):</span>
                <span className="text-emerald-600">14 Entries</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                <span className="text-slate-500">Open Tickets:</span>
                <span className="text-amber-600">3</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-50">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Service Integrity
                </p>
                <p className="text-[10px] text-blue-700 leading-relaxed italic">
                  Concierge standing is currently within elite operational thresholds.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
