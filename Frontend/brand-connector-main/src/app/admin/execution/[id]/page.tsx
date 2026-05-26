
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Zap, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight, 
  FileText, 
  Play, 
  ExternalLink,
  Loader2,
  Check,
  X,
  Plus,
  Send,
  Building2,
  Users,
  BarChart3
} from 'lucide-react';
import { useCampaignStore } from '@/store/useCampaignStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CampaignExecutionDetail() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { selectedCampaign, fetchCampaign, startCampaign, submitDeliverable, approveDeliverable, completeCampaign, loading } = useCampaignStore();
  const { releasePayment, payments, fetchPayments } = usePaymentStore();

  const [subUrl, setSubUrl] = useState('');
  const [activeDelId, setActiveDelId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaign(params.id as string);
    fetchPayments();
  }, [params.id]);

  const handleStart = async () => {
    await startCampaign(params.id as string);
    toast({ title: "Campaign Activated", description: "Creators have been notified to start work." });
  };

  const handleSubmitSim = async (delId: string) => {
    if (!subUrl) return;
    await submitDeliverable(params.id as string, delId, subUrl);
    setSubUrl('');
    setActiveDelId(null);
    toast({ title: "Deliverable Submitted", description: "Mock submission added for review." });
  };

  const handleApprove = async (delId: string) => {
    await approveDeliverable(params.id as string, delId);
    toast({ title: "Deliverable Approved" });
  };

  const handleComplete = async () => {
    await completeCampaign(params.id as string);
    // Find related payment to release
    const payment = payments.find(p => p.proposalId === selectedCampaign?.proposalId);
    if (payment) {
      await releasePayment(payment.id);
    }
    toast({ title: "Campaign Completed", description: "Funds released from escrow." });
  };

  if (loading || !selectedCampaign) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const allApproved = selectedCampaign.deliverables.every(d => d.status === 'approved');

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCampaign.name}</h1>
            <Badge className={cn(
              "uppercase text-[10px] font-black tracking-widest",
              selectedCampaign.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
            )}>
              {selectedCampaign.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-slate-500 font-medium mt-1">Executing for {selectedCampaign.companyName}</p>
        </div>
        <div className="flex gap-3">
          {selectedCampaign.status === 'completed' && (
            <Link href={`/admin/campaigns/${params.id}/analytics`}>
              <Button variant="outline" className="rounded-xl font-bold h-11 border-slate-200 bg-white">
                <BarChart3 className="mr-2 h-4 w-4 text-primary" /> View ROI Analytics
              </Button>
            </Link>
          )}
          {selectedCampaign.status === 'not_started' && (
            <Button onClick={handleStart} className="rounded-xl font-bold px-8 shadow-xl shadow-primary/20">
              <Zap className="mr-2 h-4 w-4" /> Start Execution
            </Button>
          )}
          {selectedCampaign.status !== 'completed' && allApproved && (
            <Button onClick={handleComplete} className="rounded-xl font-black px-10 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Finalize & Release Funds
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Deliverables Tracking</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Overall Progress</p>
                    <p className="text-lg font-black text-primary">{selectedCampaign.progress}%</p>
                  </div>
                  <div className="w-32">
                    <Progress value={selectedCampaign.progress} className="h-2" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="h-14 border-slate-100 bg-slate-50/30">
                    <TableHead className="pl-8 font-black text-[10px] uppercase">Talent</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">Type</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-center">Status</TableHead>
                    <TableHead className="pr-8 text-right font-black text-[10px] uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCampaign.deliverables.map((del) => (
                    <TableRow key={del.id} className="h-20 border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="h-8 w-8 p-0 flex items-center justify-center font-bold">
                            {del.creatorName[0]}
                          </Badge>
                          <span className="font-bold text-slate-900">{del.creatorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-[9px] font-black border-slate-200">{del.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {del.status === 'pending' && <Badge className="bg-slate-100 text-slate-500">Pending</Badge>}
                        {del.status === 'submitted' && <Badge className="bg-blue-100 text-blue-600">Review Needed</Badge>}
                        {del.status === 'approved' && <Badge className="bg-emerald-100 text-emerald-600">Approved</Badge>}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="flex justify-end gap-2">
                          {del.status === 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => setActiveDelId(del.id)} className="h-8 font-bold text-xs">Simulate Sub</Button>
                          )}
                          {del.status === 'submitted' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" asChild className="h-8 text-primary">
                                <a href={del.submissionUrl} target="_blank"><ExternalLink className="h-4 w-4" /></a>
                              </Button>
                              <Button size="sm" onClick={() => handleApprove(del.id)} className="h-8 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white">Approve</Button>
                            </div>
                          )}
                          {del.status === 'approved' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <AnimatePresence>
            {activeDelId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-none shadow-lg rounded-[2rem] bg-slate-900 text-white p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-black uppercase tracking-tight">Creator Simulation: Submit Work</h4>
                    <Button variant="ghost" size="icon" onClick={() => setActiveDelId(null)} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></Button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <Label className="text-white/60">Submission URL (Mock)</Label>
                      <Input 
                        placeholder="https://social.com/reel/xyz" 
                        className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                        value={subUrl}
                        onChange={e => setSubUrl(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => handleSubmitSim(activeDelId)} className="h-12 mt-8 bg-primary hover:bg-primary/90 px-8 rounded-xl font-bold">
                      Push to Review
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Assigned Talent
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {selectedCampaign.creators.map((c) => (
                <div key={c.creatorId} className="flex items-center justify-between p-3 rounded-2xl border bg-slate-50/50 border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center font-bold text-slate-400">
                      {c.name[0]}
                    </div>
                    <span className="font-bold text-slate-900">{c.name}</span>
                  </div>
                  <Badge variant="secondary" className="uppercase text-[8px] h-4 font-black">{c.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Escrow Protection</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Full budget is secured in platform escrow. Funds are released automatically only after all deliverables are approved.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Funds Verified in Escrow
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
