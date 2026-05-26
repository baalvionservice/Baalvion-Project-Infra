
'use client';

import React from 'react';
import { 
  Building2, 
  MoreVertical, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Zap, 
  Loader2, 
  ArrowUpRight,
  User,
  Instagram,
  Mail,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { Lead, LeadStatus, LeadPriority } from '@/types/crm';
import { cn } from '@/lib/utils';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function LeadsTable() {
  const { leads, loading, selectLead, totalPages, currentPage, setFilters } = useLeadStore();

  const getStatusConfig = (status: LeadStatus) => {
    switch (status) {
      case 'new': return { label: 'Inbound', color: 'bg-indigo-100 text-indigo-600', icon: Zap };
      case 'contacted': return { label: 'Contacted', color: 'bg-blue-100 text-blue-600', icon: Clock };
      case 'replied': return { label: 'Engaged', color: 'bg-orange-100 text-orange-600', icon: TrendingUp };
      case 'booked': return { label: 'In Meeting', color: 'bg-purple-100 text-purple-600', icon: CheckCircle2 };
      case 'closed': return { label: 'Converted', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 };
      case 'lost': return { label: 'Lost', color: 'bg-slate-100 text-slate-500', icon: XCircle };
      default: return { label: status, color: 'bg-slate-100 text-slate-500', icon: Clock };
    }
  };

  const getPriorityBadge = (priority: LeadPriority) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-500 text-white border-none text-[8px] h-4">HIGH</Badge>;
      case 'medium': return <Badge className="bg-yellow-400 text-white border-none text-[8px] h-4">MED</Badge>;
      case 'low': return <Badge className="bg-slate-300 text-white border-none text-[8px] h-4">LOW</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 40) return 'text-primary bg-primary/5 border-primary/10';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-100 h-16 bg-slate-50/30">
              <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Brand Context</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Niche</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Score</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Priority</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Owner</TableHead>
              <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="h-24 border-slate-50">
                  <TableCell className="pl-8"><Skeleton className="h-12 w-48 rounded-xl" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-8 w-12 rounded-lg mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-24 rounded-full mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-32 rounded-xl mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
                  <TableCell className="pr-8"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : leads.map((lead) => {
              const status = getStatusConfig(lead.status);
              return (
                <TableRow 
                  key={lead.id} 
                  className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24 cursor-pointer"
                  onClick={() => selectLead(lead.id)}
                >
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 leading-none truncate max-w-[200px]">{lead.companyName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">{lead.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase border-none px-2.5 h-5">{lead.niche}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-12 h-8 rounded-xl font-black text-sm border",
                      getScoreColor(lead.score)
                    )}>
                      {lead.score}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getPriorityBadge(lead.priority)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border-none shadow-sm", status.color)}>
                      <status.icon className="h-3 w-3 mr-1.5" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white border shadow-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary text-white text-[8px] font-black">{lead.assignedTo?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-slate-600">{lead.assignedTo || 'Unassigned'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <Button variant="ghost" size="icon" className="rounded-full text-slate-300 group-hover:text-primary transition-all">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-10 px-4 font-bold bg-white" 
              disabled={currentPage === 1}
              onClick={() => setFilters({ page: currentPage - 1 })}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-10 px-4 font-bold bg-white" 
              disabled={currentPage === totalPages}
              onClick={() => setFilters({ page: currentPage + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
