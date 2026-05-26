
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Loader2,
  Zap,
  Clock,
  UserX,
  ShieldCheck,
  MoreVertical,
  ExternalLink,
  MessageSquare,
  History,
  ThumbsUp,
  ThumbsDown,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { collection, query, orderBy, doc, updateDoc, addDoc, where } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { FlaggedContent, DeliverableStatus } from '@/types';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function AdminContentModerationPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Fetch Flagged Content
  const flaggedContentQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'flagged_content'), where('status', '==', 'PENDING'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: flaggedItems, loading } = useCollection<FlaggedContent>(flaggedContentQuery);

  const filteredItems = useMemo(() => {
    return flaggedItems.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || item.flagType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [flaggedItems, searchQuery, typeFilter]);

  const handleAction = async (action: 'CLEAR' | 'REMOVE' | 'WARN' | 'SUSPEND') => {
    if (!selectedItem || isProcessing) return;
    setIsProcessing(true);

    const flagRef = doc(db!, 'flagged_content', selectedItem.id);
    const deliverableRef = doc(db!, 'deliverables', selectedItem.deliverableId);
    const userRef = doc(db!, 'users', selectedItem.creatorId);

    try {
      if (action === 'CLEAR') {
        await updateDoc(flagRef, { status: 'CLEARED' });
        toast({ title: "Flag Cleared", description: "Content has been approved." });
      } else if (action === 'REMOVE') {
        await updateDoc(flagRef, { status: 'REMOVED' });
        await updateDoc(deliverableRef, { status: DeliverableStatus.REMOVED });

        await addDoc(collection(db!, 'notifications'), {
          userId: selectedItem.creatorId,
          title: 'Content Removed ⚠️',
          message: `Your deliverable for campaign #${selectedItem.campaignId} was removed due to policy violations.`,
          type: 'SYSTEM',
          read: false,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Content Removed", description: "Creator has been notified." });
      } else if (action === 'WARN') {
        await addDoc(collection(db!, 'notifications'), {
          userId: selectedItem.creatorId,
          title: 'Formal Policy Warning 🛡️',
          message: 'One of your recent submissions triggered our safety filters. Please review our marketplace guidelines.',
          type: 'SYSTEM',
          read: false,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Warning Sent", description: "Formal policy alert delivered." });
      } else if (action === 'SUSPEND') {
        await updateDoc(userRef, { status: 'SUSPENDED' });
        toast({ title: "Creator Suspended", description: "Account access revoked." });
      }

      setIsAuditOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: flagRef.path,
        operation: 'update'
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const getFlagBadge = (type: string) => {
    switch (type) {
      case 'USER_REPORT': return <Badge className="bg-orange-100 text-orange-600 border-none text-[9px]">BRAND REPORT</Badge>;
      case 'AUTO_KEYWORD': return <Badge className="bg-red-100 text-red-600 border-none text-[9px]">KEYWORD MATCH</Badge>;
      case 'AI_DETECTION': return <Badge className="bg-primary/10 text-primary border-none text-[9px]">AI ANOMALY</Badge>;
      default: return <Badge variant="outline" className="text-[9px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Content Moderation
          </h1>
          <p className="text-slate-500 font-medium">Audit flagged deliverables, enforce safety policies, and protect marketplace standards.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase h-11 px-4 rounded-xl flex items-center gap-2">
            <Clock className="h-4 w-4" /> {flaggedItems.length} Awaiting Review
          </Badge>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by ID or reason..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[160px]">
              <SelectValue placeholder="All Flag Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">All Flag Types</SelectItem>
              <SelectItem value="USER_REPORT" className="font-bold">Brand Reports</SelectItem>
              <SelectItem value="AUTO_KEYWORD" className="font-bold text-red-600">Keyword Alerts</SelectItem>
              <SelectItem value="AI_DETECTION" className="font-bold">AI Detection</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Flagged Ledger */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Content ID</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Flag Type</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Risk Factor</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Reported Reason</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <TableRow key={item.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 truncate max-w-[150px]">#{item.id.substring(0, 8)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getFlagBadge(item.flagType)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={cn(
                          "text-lg font-black",
                          item.riskFactor > 80 ? "text-red-600" : item.riskFactor > 50 ? "text-orange-500" : "text-slate-900"
                        )}>
                          {item.riskFactor}%
                        </span>
                        <div className="w-12 h-1 bg-slate-100 rounded-full mt-1">
                          <div
                            className={cn("h-full rounded-full", item.riskFactor > 80 ? "bg-red-600" : "bg-orange-500")}
                            style={{ width: `${item.riskFactor}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <p className="text-xs font-medium text-slate-600 truncate max-w-[200px] mx-auto italic">
                        "{item.reason}"
                      </p>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl font-bold h-10 px-4 bg-slate-50 text-slate-600 hover:text-primary transition-all"
                        onClick={() => { setSelectedItem(item); setIsAuditOpen(true); }}
                      >
                        <Eye className="h-4 w-4 mr-1.5" /> Audit Content
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
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Content Queue is Clean</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Governance Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
          <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
            <ShieldAlert className="h-8 w-8 text-orange-400" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold">Safety Enforcement</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Review media for misleading healthcare claims, financial advice violations, or inappropriate visual branding. Content removal is permanent.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">AI Auto-Flagging</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Our neural network scans for 150+ prohibited keywords and visual patterns. Items with Risk Factors over 90% are automatically hidden from brands.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Dialog */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none max-w-4xl shadow-2xl">
          <div className="bg-slate-50 p-8 border-b">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black">Content Audit Center</DialogTitle>
                    <DialogDescription className="font-medium">Flag ID: #{selectedItem?.id.substring(0, 8)}</DialogDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Score</p>
                  <p className="text-3xl font-black text-red-600">{selectedItem?.riskFactor}%</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-10 max-h-[65vh] overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Media Preview Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Submission Preview</h4>
                <div className="aspect-video rounded-3xl bg-slate-900 relative overflow-hidden group">
                  <img src="https://picsum.photos/seed/mod/800/450" className="w-full h-full object-cover opacity-60" alt="Preview" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:scale-110 transition-transform">
                      <PlayCircle className="h-10 w-10" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white text-xs h-9">
                    <History className="h-3.5 w-3.5 mr-1.5" /> View Deliverable History
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white text-xs h-9">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Original Brief
                  </Button>
                </div>
              </div>

              {/* Context Details */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Incident Context</h4>
                  <div className="p-6 rounded-2xl bg-white border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-400 uppercase tracking-tighter text-xs">Flag Category</span>
                      <Badge variant="secondary" className="bg-red-50 text-red-600 border-none text-[10px] uppercase">{selectedItem?.flagType.replace('_', ' ')}</Badge>
                    </div>
                    <Separator className="opacity-50" />
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Evidence Statement</span>
                      <p className="text-sm text-slate-700 font-medium mt-2 leading-relaxed">
                        "{selectedItem?.reason}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2">Target Creator</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border">
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">C</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-slate-900 truncate">@{selectedItem?.creatorId.substring(0, 10)}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2">Campaign ID</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-600">#{selectedItem?.campaignId.substring(0, 8)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Moderation Controls */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Graduated Enforcement Actions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { id: 'CLEAR', label: 'Approve Content', color: 'bg-emerald-500', icon: ThumbsUp, desc: 'Dismiss flag' },
                  { id: 'REMOVE', label: 'Remove Content', color: 'bg-orange-500', icon: ThumbsDown, desc: 'Revoke asset' },
                  { id: 'WARN', label: 'Issue Warning', color: 'bg-slate-900', icon: MessageSquare, desc: 'Policy alert' },
                  { id: 'SUSPEND', label: 'Suspend User', color: 'bg-red-600', icon: UserX, desc: 'Revoke access' },
                ].map((act) => (
                  <Button
                    key={act.id}
                    variant="outline"
                    className={cn(
                      "rounded-2xl h-24 font-black flex flex-col items-center justify-center gap-1 transition-all group border-slate-100 hover:border-slate-300",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => handleAction(act.id as any)}
                  >
                    <act.icon className={cn("h-5 w-5 mb-1 group-hover:scale-110 transition-transform", act.id === 'SUSPEND' ? "text-red-600" : "text-slate-400")} />
                    <span className="text-[11px] uppercase tracking-tighter">{act.label}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">{act.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => setIsAuditOpen(false)}>Close Audit</Button>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mr-auto ml-4">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Administrative Decision Final
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
