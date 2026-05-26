
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  FileText,
  MessageSquare,
  ExternalLink,
  Download,
  Loader2,
  Clock,
  ArrowRight,
  User,
  Building2,
  Zap,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Split,
  History,
  Info
} from 'lucide-react';
import { collection, query, orderBy, doc, updateDoc, addDoc, where } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Dispute, DisputeStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function AdminDisputeResolutionPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('FILED');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isRulingDialogOpen, setIsRulingDialogOpen] = useState(false);
  const [rulingType, setRulingType] = useState<'CREATOR' | 'BRAND' | 'SPLIT'>('CREATOR');
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Disputes
  const disputesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'disputes'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: disputes, loading } = useCollection<Dispute>(disputesQuery);

  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      const matchesSearch = d.campaignId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [disputes, searchQuery, statusFilter]);

  const handleRuling = async () => {
    if (!selectedDispute || isSubmitting) return;
    if (!adminNote.trim()) {
      return toast({ variant: 'destructive', title: 'Note Required', description: 'Please provide a justification for the ruling.' });
    }

    setIsSubmitting(true);
    const disputeRef = doc(db!, 'disputes', selectedDispute.id);

    const updateData = {
      status: DisputeStatus.RESOLVED,
      adminNotes: adminNote,
      ruling: rulingType,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(disputeRef, updateData);

      // Notify Creator
      await addDoc(collection(db!, 'notifications'), {
        userId: selectedDispute.creatorId,
        title: rulingType === 'CREATOR' ? 'Dispute Resolved in Your Favor! 🎉' : 'Dispute Resolution Update',
        message: rulingType === 'CREATOR'
          ? `Arbitration complete for campaign #${selectedDispute.campaignId}. Escrow funds have been released.`
          : `The dispute for campaign #${selectedDispute.campaignId} has been resolved in favor of the brand. Reason: ${adminNote}`,
        type: 'PAYMENT',
        read: false,
        createdAt: new Date().toISOString(),
        link: `/dashboard/creator/wallet`
      });

      // Notify Brand
      await addDoc(collection(db!, 'notifications'), {
        userId: selectedDispute.brandId,
        title: rulingType === 'BRAND' ? 'Dispute Resolved: Refund Issued' : 'Dispute Resolution Update',
        message: rulingType === 'BRAND'
          ? `Arbitration complete. The escrow hold for campaign #${selectedDispute.campaignId} has been refunded to your wallet.`
          : `The dispute for campaign #${selectedDispute.campaignId} has been resolved in favor of the creator. Reason: ${adminNote}`,
        type: 'SYSTEM',
        read: false,
        createdAt: new Date().toISOString(),
        link: `/dashboard/brand/wallet`
      });

      toast({
        title: "Final Ruling Applied",
        description: `Case resolved in favor of ${rulingType.toLowerCase()}. Both parties notified.`
      });

      setIsRulingDialogOpen(false);
      setAdminNote('');
      setSelectedDispute(null);
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: disputeRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'FILED': return { label: 'New Filing', color: 'bg-red-100 text-red-600', icon: AlertTriangle };
      case 'UNDER_REVIEW': return { label: 'In Audit', color: 'bg-orange-100 text-orange-600', icon: Clock };
      case 'RESOLVED': return { label: 'Resolved', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 };
      default: return { label: status, color: 'bg-slate-100 text-slate-500', icon: Info };
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            Mediation Hub
          </h1>
          <p className="text-slate-500 font-medium">Arbitrate marketplace disagreements and manage escrow release holds.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-red-100 text-red-600 border-none text-[10px] font-black uppercase h-11 px-4 rounded-xl flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> {disputes.filter(d => d.status === 'FILED').length} Active Disputes
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by campaign ID or Dispute Ref..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">All Cases</SelectItem>
              <SelectItem value="FILED" className="font-bold text-red-600">New Filings</SelectItem>
              <SelectItem value="UNDER_REVIEW" className="font-bold">Under Audit</SelectItem>
              <SelectItem value="RESOLVED" className="font-bold">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Disputes Ledger */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Conflict Details</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Parties Involved</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Locked Escrow</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredDisputes.length > 0 ? (
                filteredDisputes.map((dispute, idx) => {
                  const status = getStatusConfig(dispute.status);
                  return (
                    <TableRow key={dispute.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-28">
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="font-black text-slate-900 leading-none truncate max-w-[250px]">{dispute.category.replace('_', ' ')}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] uppercase h-4 px-1.5">ID: {dispute.id.substring(0, 8)}</Badge>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Campaign #{dispute.campaignId.substring(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex -space-x-2">
                            <Avatar className="h-7 w-7 border-2 border-white">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">C</AvatarFallback>
                            </Avatar>
                            <Avatar className="h-7 w-7 border-2 border-white">
                              <AvatarFallback className="bg-slate-900 text-white text-[10px] font-bold">B</AvatarFallback>
                            </Avatar>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Creator vs Brand</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-slate-900">₹45,000</span>
                          <span className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                            <ShieldAlert className="h-2.5 w-2.5" /> Locked
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border-none", status.color)}>
                          <status.icon className="h-3 w-3 mr-1.5" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl font-bold h-10 px-4 bg-slate-50 text-slate-600 hover:text-primary"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setIsRulingDialogOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1.5" /> Audit Case
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <Scale className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Mediation Queue is Empty</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Decision Dialog */}
      <Dialog open={isRulingDialogOpen} onOpenChange={setIsRulingDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none max-w-3xl shadow-2xl">
          <div className="bg-slate-50 p-8 border-b">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">Mediation Center</DialogTitle>
                  <DialogDescription className="font-medium">Case Review: {selectedDispute?.category.replace('_', ' ')}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-10 max-h-[65vh] overflow-y-auto scrollbar-hide">
            {/* Case Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Creator Statement</h4>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium">
                  "{selectedDispute?.reason}"
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proposed Resolution</h4>
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 font-bold">
                  {selectedDispute?.proposedResolution}
                </div>
              </div>
            </div>

            {/* Evidence Gallery */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Submitted Evidence</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedDispute?.evidenceUrls?.map((url, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                    <img src={url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="ghost" size="icon" className="text-white h-10 w-10" asChild>
                        <a href={url} target="_blank"><ExternalLink className="h-5 w-5" /></a>
                      </Button>
                    </div>
                  </div>
                ))}
                {(!selectedDispute?.evidenceUrls || selectedDispute.evidenceUrls.length === 0) && (
                  <div className="col-span-4 p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase">
                    No visual evidence attached
                  </div>
                )}
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Ruling Actions */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="font-bold text-slate-700">Official Ruling Decision</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'CREATOR', label: 'Favor Creator', color: 'bg-emerald-500', icon: ThumbsUp, desc: 'Release Funds' },
                    { id: 'BRAND', label: 'Favor Brand', color: 'bg-red-500', icon: ThumbsDown, desc: 'Refund Funds' },
                    { id: 'SPLIT', label: 'Split Decision', color: 'bg-indigo-500', icon: Split, desc: '50/50 Settlement' },
                  ].map((act) => (
                    <Button
                      key={act.id}
                      variant="outline"
                      className={cn(
                        "rounded-xl font-bold h-20 transition-all flex flex-col items-center justify-center gap-1",
                        rulingType === act.id ? `${act.color} text-white border-transparent shadow-xl scale-105` : "bg-white text-slate-400 border-slate-100"
                      )}
                      onClick={() => setRulingType(act.id as any)}
                    >
                      <act.icon className="h-5 w-5" />
                      <span>{act.label}</span>
                      <span className="text-[8px] font-black uppercase opacity-60">{act.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-bold text-slate-700">Admin Justification (Sent to both parties)</Label>
                <Textarea
                  placeholder="Provide a detailed legal/professional justification for this ruling based on the campaign brief and evidence..."
                  className="min-h-[120px] rounded-2xl p-6 bg-slate-50 border-none focus-visible:ring-primary text-md"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => setIsRulingDialogOpen(false)}>Close Review</Button>
            <Button
              disabled={isSubmitting || !adminNote.trim()}
              onClick={handleRuling}
              className={cn(
                "rounded-xl font-black h-12 px-10 shadow-xl",
                rulingType === 'CREATOR' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" :
                  rulingType === 'BRAND' ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"
              )}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finalize Arbitration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Governance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
          <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold">Impartiality Protocol</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Review original brief requirements vs submitted deliverables. Escrow release is final. All mediation actions are logged for compliance auditing.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
            <History className="h-8 w-8 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Evidence Retention</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Dispute files are retained for 7 years per regulatory guidelines for financial arbitration within the Baalvion Connect marketplace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
