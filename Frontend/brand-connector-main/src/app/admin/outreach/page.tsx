'use client';

import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Send, 
  Mail, 
  MessageSquare, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Loader2,
  Zap,
  LayoutDashboard,
  Users,
  Search,
  MoreVertical,
  X,
  Target,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useOutreachStore } from '@/store/useOutreachStore';
import { useLeadStore } from '@/store/useLeadStore';
import { useDealStore } from '@/store/useDealStore';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function OutreachDashboard() {
  const { 
    campaigns, 
    loading, 
    fetchCampaigns, 
    createCampaign, 
    startSending, 
    selectCampaign,
    sending,
    messages,
    fetchMessages,
    generateReplies
  } = useOutreachStore();
  
  const { leads, fetchLeads } = useLeadStore();
  const { convertFromReply } = useDealStore();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConvertingId, setIsConvertingId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email' as any,
    subject: '',
    template: 'Hi {{companyName}}, we saw your brand and...'
  });

  useEffect(() => {
    fetchCampaigns();
    fetchLeads();
  }, []);

  const handleCreate = async () => {
    if (!newCampaign.name || selectedLeads.length === 0) return;
    
    await createCampaign({
      name: newCampaign.name,
      type: newCampaign.type,
      leadIds: selectedLeads,
      messageTemplate: newCampaign.template,
      subject: newCampaign.type === 'email' ? newCampaign.subject : undefined
    });

    toast({ title: "Campaign Created", description: "Ready to launch sequence." });
    setIsCreateOpen(false);
    setSelectedLeads([]);
  };

  const handleLaunch = async (id: string) => {
    toast({ title: "Launching Sequence", description: "Dispatching messages to queue..." });
    await startSending(id);
    toast({ title: "Messages Dispatched" });
    await generateReplies(id);
    toast({ title: "Initial Replies Received", description: "Check the reply monitor for interested leads." });
  };

  const handleConvertToDeal = async (msgId: string) => {
    setIsConvertingId(msgId);
    try {
      await convertFromReply(msgId);
      toast({ title: "Deal Created!", description: "Lead has been moved to the sales pipeline." });
    } finally {
      setIsConvertingId(null);
    }
  };

  const repliedMessages = messages.filter(m => m.status === 'replied');

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Outreach Command
          </h1>
          <p className="text-slate-500 font-medium">Manage multi-channel cold outreach sequences and reply funnels.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <BarChart3 className="mr-2 h-4 w-4" /> Global Performance
          </Button>
          <Button className="rounded-xl font-black shadow-xl shadow-primary/20 h-11 px-6" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Sequence
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Campaign List */}
        <div className="lg:col-span-12 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Active Sequences
            </h2>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 h-16 bg-slate-50/30">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Sequence Name</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Type</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Progress</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Engagement</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Control</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="h-24 border-slate-50">
                        <TableCell colSpan={6} className="px-8"><div className="h-12 bg-slate-100 rounded-2xl w-full animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : campaigns.map((camp) => (
                    <TableRow key={camp.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24">
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            {camp.type === 'email' ? <Mail className="h-6 w-6 text-blue-500" /> : <MessageSquare className="h-6 w-6 text-pink-500" />}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 leading-none">{camp.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">{new Date(camp.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase">{camp.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center px-8">
                        <div className="space-y-2 min-w-[120px]">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">{camp.sentCount} / {camp.totalLeads} Sent</span>
                            <span className="text-primary">{Math.round((camp.sentCount/camp.totalLeads)*100)}%</span>
                          </div>
                          <Progress value={(camp.sentCount/camp.totalLeads)*100} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-lg font-black text-slate-900">{camp.replyCount}</span>
                          <span className="text-[9px] font-bold text-emerald-600 uppercase">Replies</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase border-none",
                          camp.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {camp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {camp.status === 'draft' && (
                            <Button size="sm" className="rounded-xl font-bold h-9 bg-primary shadow-lg shadow-primary/20" onClick={() => handleLaunch(camp.id)} disabled={sending}>
                              {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1.5" />}
                              Launch
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => { selectCampaign(camp); fetchMessages(camp.id); }}>
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reply Inbox Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white h-[500px] flex flex-col overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Reply Monitor</CardTitle>
              <CardDescription>Incoming engagement from your active sequences.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-full">
                <div className="divide-y divide-slate-50">
                  {repliedMessages.length > 0 ? repliedMessages.map((r, i) => (
                    <div key={i} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors group">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-slate-900">{r.leadName}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Just now</span>
                        </div>
                        <p className="text-sm text-slate-600 italic">"{r.replyText}"</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge className={cn(
                            "text-[8px] font-black uppercase px-2 h-4 border-none",
                            r.isInterested ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {r.isInterested ? "Interested" : "Inconclusive"}
                          </Badge>
                          {r.isInterested && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={isConvertingId === r.id}
                              className="h-6 text-[10px] font-black text-primary p-0 hover:bg-transparent hover:underline"
                              onClick={() => handleConvertToDeal(r.id)}
                            >
                              {isConvertingId === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                              Move to Sales Pipeline <ArrowRight className="ml-1 h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                        <Clock className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No replies detected</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">AI Outreach Advisor</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Sequences with **3+ follow-ups** have a **2.4x higher** response rate. We recommend adding a follow-up step to your active campaigns.
                </p>
              </div>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-12 text-[10px] uppercase tracking-widest shadow-lg">
                Automate Follow-ups
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 border border-slate-100">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Pipeline Health</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">Reply Rate</span>
                <span className="text-primary">12.4%</span>
              </div>
              <Progress value={45} className="h-1" />
              <p className="text-[9px] text-slate-400 font-medium">Targeting 15% for Q3 benchmark.</p>
            </div>
          </Card>
        </aside>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-50 p-8 border-b">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">Configure Sequence</DialogTitle>
                  <DialogDescription className="font-medium text-slate-500">Define your outreach strategy and target segment.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">Campaign Name</Label>
                <Input 
                  placeholder="e.g. Q4 Growth Brands" 
                  className="rounded-xl h-11"
                  value={newCampaign.name}
                  onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Channel</Label>
                <Select value={newCampaign.type} onValueChange={v => setNewCampaign({...newCampaign, type: v})}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email" className="font-bold">Cold Email</SelectItem>
                    <SelectItem value="dm" className="font-bold">Instagram DM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-bold">Target Leads from CRM</Label>
              <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1 pr-4">
                {leads.map(lead => (
                  <div key={lead.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <Checkbox 
                      id={lead.id}
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => {
                        setSelectedLeads(prev => checked ? [...prev, lead.id] : prev.filter(i => i !== lead.id));
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{lead.companyName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{lead.niche}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="font-bold">Message Blueprint</Label>
              {newCampaign.type === 'email' && (
                <Input 
                  placeholder="Subject Line" 
                  className="rounded-xl h-11 mb-3"
                  value={newCampaign.subject}
                  onChange={e => setNewCampaign({...newCampaign, subject: e.target.value})}
                />
              )}
              <Textarea 
                placeholder="Write your template. Use {{companyName}} for dynamic inserts." 
                className="min-h-[150px] rounded-2xl p-6 bg-slate-50 border-none resize-none"
                value={newCampaign.template}
                onChange={e => setNewCampaign({...newCampaign, template: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button 
              className="rounded-xl font-black px-10 h-12 shadow-xl shadow-primary/20"
              onClick={handleCreate}
              disabled={!newCampaign.name || selectedLeads.length === 0}
            >
              Verify & Queue Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}