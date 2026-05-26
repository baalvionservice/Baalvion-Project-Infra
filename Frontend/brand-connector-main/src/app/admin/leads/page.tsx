
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  TrendingUp, 
  Clock, 
  Zap, 
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  Target,
  ArrowUpRight,
  ShieldCheck,
  RefreshCcw,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { LeadsTable } from '@/components/crm/LeadsTable';
import { LeadDrawer } from '@/components/crm/LeadDrawer';
import { CreateLeadModal } from '@/components/crm/CreateLeadModal';
import { ScoringInsights } from '@/components/crm/ScoringInsights';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import { CREATOR_NICHES } from '@/constants';
import { useToast } from '@/hooks/use-toast';

export default function LeadsDashboard() {
  const { fetchLeads, filters, setFilters, loading, totalLeads, runScoring, scoringLoading, fetchInsights } = useLeadStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
    fetchInsights();
  }, []);

  const handleRunScoring = async () => {
    await runScoring();
    toast({
      title: "Scoring Complete",
      description: "Priority rankings and value scores have been recalibrated.",
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Lead Acquisition Pipeline
          </h1>
          <p className="text-slate-500 font-medium">Manage brand partnerships, acquisition funnel, and lifecycle transitions.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl font-bold bg-white h-11 border-primary/20 text-primary" 
            onClick={handleRunScoring}
            disabled={scoringLoading}
          >
            {scoringLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Run AI Scoring
          </Button>
          <Button className="rounded-xl font-black shadow-xl shadow-primary/20 h-11 px-6" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Lead Entry
          </Button>
        </div>
      </div>

      {/* Scoring Insights Panel */}
      <ScoringInsights />

      {/* Control & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by company, email or agent..." 
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={filters.status} onValueChange={(v: any) => setFilters({ status: v })}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold">All Lifecycles</SelectItem>
                <SelectItem value="new" className="font-bold">Inbound (New)</SelectItem>
                <SelectItem value="contacted" className="font-bold">Contacted</SelectItem>
                <SelectItem value="replied" className="font-bold">Engaged</SelectItem>
                <SelectItem value="booked" className="font-bold">Meeting Booked</SelectItem>
                <SelectItem value="closed" className="font-bold">Converted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(v: any) => setFilters({ priority: v })}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold">All Priorities</SelectItem>
                <SelectItem value="high" className="font-bold text-red-600">High Priority</SelectItem>
                <SelectItem value="medium" className="font-bold text-yellow-600">Medium Priority</SelectItem>
                <SelectItem value="low" className="font-bold">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/5 text-primary border-none h-8 px-4 font-black text-[10px] uppercase">
            {totalLeads} Active Leads
          </Badge>
        </div>
      </div>

      {/* Main Table */}
      <LeadsTable />

      {/* Detail Views & Modals */}
      <AnimatePresence>
        <LeadDrawer />
      </AnimatePresence>
      <CreateLeadModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />

      {/* Strategy Banner */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
        <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
          <ArrowUpRight className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2 relative z-10">
          <h3 className="text-lg font-bold">Priority Targeting Model</h3>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">
            Leads with scores above **75** are automatically flagged as High Priority. Outreach focus should be prioritized for SaaS and Fintech sectors this quarter.
          </p>
        </div>
      </div>
    </div>
  );
}
