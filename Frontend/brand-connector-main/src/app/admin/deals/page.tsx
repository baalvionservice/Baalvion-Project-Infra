
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  IndianRupee, 
  TrendingUp, 
  Users, 
  MoreVertical, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Zap,
  Loader2,
  X,
  History,
  Send,
  Building2,
  Briefcase,
  FileText
} from 'lucide-react';
import { useDealStore } from '@/store/useDealStore';
import { useProposalStore } from '@/store/useProposalStore';
import { useMatchingStore } from '@/store/useMatchingStore';
import { PIPELINE_STAGES, Deal, DealStage } from '@/types/deal';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MatchingPanel } from '@/components/crm/MatchingPanel';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function SalesPipelinePage() {
  const { fetchDeals, deals, loading, getDealsByStage, getInsights, selectDeal, selectedDeal, updateDeal, addNote } = useDealStore();
  const { createProposal, loading: propLoading } = useProposalStore();
  const { clearMatches } = useMatchingStore();
  const { toast } = useToast();
  const router = useRouter();
  const insights = getInsights();

  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleStageDrop = (dealId: string, newStage: DealStage) => {
    updateDeal(dealId, { stage: newStage });
    toast({ title: "Stage Updated", description: `Deal moved to ${newStage.replace('_', ' ')}` });
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedDeal) return;
    setIsSubmittingNote(true);
    try {
      await addNote(selectedDeal.id, noteText);
      setNoteText('');
      toast({ title: "Note added to deal" });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!selectedDeal) return;
    const propId = await createProposal(selectedDeal.id);
    if (propId) {
      toast({ title: "Proposal Drafted", description: "Navigating to pricing workspace..." });
      router.push('/admin/proposals');
    }
  };

  const handleCloseDrawer = () => {
    selectDeal(null);
    clearMatches();
  };

  return (
    <div className="space-y-8 pb-20 h-[calc(100vh-120px)] flex flex-col">
      {/* Header & Insights */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Sales Revenue Pipeline
          </h1>
          <p className="text-slate-500 font-medium">Track brand conversions and manage high-value creative partnerships.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11" onClick={() => router.push('/admin/proposals')}>
            <FileText className="mr-2 h-4 w-4 text-primary" /> View Proposals
          </Button>
          <Button className="rounded-xl font-black shadow-xl shadow-primary/20 h-11 px-6">
            <Plus className="mr-2 h-4 w-4" /> New Manual Deal
          </Button>
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        {[
          { label: 'Pipeline Value', value: `₹${(insights.totalValue / 100000).toFixed(1)}L`, icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Closed Won', value: `₹${(insights.wonValue / 100000).toFixed(1)}L`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Deals', value: insights.count, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Conversion Rate', value: `${insights.winRate}%`, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-center gap-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 -mx-4 px-4 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div key={stage.id} className="w-80 flex flex-col h-full group">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("rounded-lg font-black text-[10px] uppercase tracking-tighter border-none h-6 px-2.5", stage.color)}>
                      {stage.name}
                    </Badge>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">₹{(totalValue / 1000).toFixed(0)}k</span>
                </div>

                <ScrollArea className="flex-1 bg-slate-100/50 rounded-[2.5rem] p-3 border-2 border-transparent hover:border-slate-200/50 transition-colors">
                  <div className="space-y-3">
                    {stageDeals.map((deal) => (
                      <motion.div
                        key={deal.id}
                        layoutId={deal.id}
                        onClick={() => selectDeal(deal)}
                        className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group/card"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-black text-slate-900 leading-tight truncate pr-4 group-hover/card:text-primary transition-colors">
                              {deal.companyName}
                            </h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900">₹{deal.value.toLocaleString()}</span>
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5 border">
                                <AvatarFallback className="text-[8px] font-bold bg-slate-100">{deal.assignedTo?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[60px]">{deal.assignedTo?.split(' ')[0]}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <div className="flex items-center gap-1.5">
                              {deal.source === 'outreach' ? <Zap className="h-2.5 w-2.5 text-primary fill-primary" /> : <Users className="h-2.5 w-2.5 text-slate-400" />}
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{deal.source}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-300 uppercase">
                              {new Date(deal.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {stageDeals.length === 0 && (
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No deals here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedDeal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
              onClick={handleCloseDrawer}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white z-[70] shadow-2xl flex flex-col border-l"
            >
              <header className="p-8 border-b bg-slate-50/50 space-y-6 shrink-0">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase h-6 px-3">
                    Deal Workspace
                  </Badge>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={handleCloseDrawer}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-start gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                      {selectedDeal.companyName}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase">ID: {selectedDeal.id}</Badge>
                      <span className="text-xs font-bold text-slate-400">Created {new Date(selectedDeal.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Negotiated Value (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        type="number"
                        className="pl-9 h-11 rounded-xl bg-white font-black text-lg border-slate-200"
                        value={selectedDeal.value}
                        onChange={(e) => updateDeal(selectedDeal.id, { value: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Stage</Label>
                    <Select value={selectedDeal.stage} onValueChange={(v: any) => handleStageDrop(selectedDeal.id, v)}>
                      <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(s => (
                          <SelectItem key={s.id} value={s.id} className="font-bold uppercase text-[10px]">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </header>

              <ScrollArea className="flex-1">
                <div className="p-8 space-y-10">
                  {/* AI MATCHING PANEL */}
                  <MatchingPanel dealId={selectedDeal.id} />

                  <Separator />

                  <section className="space-y-4">
                    <Button 
                      className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20 uppercase text-xs tracking-widest"
                      onClick={handleCreateProposal}
                      disabled={propLoading}
                    >
                      {propLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                      Create Campaign Proposal
                    </Button>
                  </section>

                  <Separator />

                  {/* Notes & Timeline */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                        <History className="h-3 w-3" /> Deal Timeline
                      </h3>
                    </div>

                    <form onSubmit={handleAddNote} className="relative">
                      <Textarea 
                        placeholder="Add internal feedback or log a meeting result..." 
                        className="rounded-2xl min-h-[100px] bg-slate-50 border-none focus-visible:ring-primary p-5 pb-12 resize-none text-sm"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <div className="absolute bottom-3 right-3">
                        <Button size="sm" type="submit" disabled={isSubmittingNote || !noteText.trim()} className="rounded-lg font-bold px-4 h-8 shadow-sm">
                          {isSubmittingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1.5" />}
                          Add Note
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-4">
                      {selectedDeal.notes.map((note) => (
                        <div key={note.id} className="relative pl-6 last:after:hidden after:absolute after:left-0 after:top-2 after:bottom-0 after:w-px after:bg-slate-100">
                          <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-primary/20 ring-4 ring-white" />
                          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{note.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <footer className="p-8 border-t bg-slate-50/50 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mr-auto">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Audited Transaction Path
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 font-bold text-xs" onClick={() => handleStageDrop(selectedDeal.id, 'closed_lost')}>Mark as Lost</Button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
