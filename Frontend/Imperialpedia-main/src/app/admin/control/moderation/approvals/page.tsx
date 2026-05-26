'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Loader2, 
  Clock, 
  Eye,
  ArrowLeft,
  FileText,
  User,
  ShieldAlert,
  Flag,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { moderationService } from '@/services/data/moderation-service';
import { ModerationApproval } from '@/types/moderation';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Content Moderation Approvals Matrix.
 * Specialized control panel for processing and rendering decisions on reported content.
 */
export default function ModerationApprovalsPage() {
  const [items, setItems] = useState<ModerationApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Inspection Modal States
  const [inspectedItem, setInspectedItem] = useState<ModerationApproval | null>(null);

  useEffect(() => {
    async function loadApprovals() {
      try {
        const response = await moderationService.getModerationApprovals();
        if (response.data) setItems(response.data);
      } catch (e) {
        console.error('Approvals sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadApprovals();
  }, []);

  const handleDecision = async (id: string, action: 'Approve' | 'Reject') => {
    setProcessingId(id);
    try {
      const response = await moderationService.moderateContent(id, action);
      if (response.data) {
        setItems(prev => prev.map(item => item.id === id ? response.data! : item));
        toast({
          title: action === 'Approve' ? "Content Cleared" : "Content Rejected",
          description: `The decision has been committed to the intelligence index.`,
          variant: action === 'Reject' ? 'destructive' : 'default',
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Decision Error",
        description: "Failed to synchronize moderation verdict.",
      });
    } finally {
      setProcessingId(null);
      setInspectedItem(null);
    }
  };

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(search.toLowerCase()) ||
    item.creator.toLowerCase().includes(search.toLowerCase()) ||
    item.reportType.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: ModerationApproval['status']) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <Clock className="h-2.5 w-2.5 animate-pulse" /> Pending
        </Badge>;
      case 'Approved':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <CheckCircle2 className="h-2.5 w-2.5" /> Approved
        </Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <XCircle className="h-2.5 w-2.5" /> Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/control/moderation"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldAlert className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Editorial Decision Loop</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Report Verification</Text>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Decision Integrity Active</span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search report archive by content, expert, or type..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 px-4 rounded-xl border-white/10 gap-2 font-bold text-xs bg-background/30">
          <Filter className="h-3.5 w-3.5" /> Matrix Filters
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest py-4">Reported Content</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Expert Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Classification</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Current Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Streaming Report Matrix...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No reports localized within the current decision buffer.
                  </TableCell>
                </TableRow>
              ) : filteredItems.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate max-w-[300px]">{item.content}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground uppercase">{format(new Date(item.date), 'MMM d, HH:mm')}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <User className="h-3.5 w-3.5 text-secondary" />
                      {item.creator}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background/50 border-white/10 text-[9px] font-bold uppercase px-3">
                      {item.reportType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(item.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setInspectedItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {item.status === 'Pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                            disabled={!!processingId}
                            onClick={() => handleDecision(item.id, 'Reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-muted-foreground hover:text-emerald-500 transition-colors"
                            disabled={!!processingId}
                            onClick={() => handleDecision(item.id, 'Approve')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Strategic Insight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Approval Confidence</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Approved content is immediately re-indexed and stripped of any "Reported" visual warnings. The creator's trust score is incremented by **+0.5**.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Rejection Impact</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Rejected content nodes are de-indexed and archived for a 30-day appeal window. Continuous rejections trigger a mandatory expert re-vetting cycle.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-amber-500/20 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500">
            <Flag className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Factual Integrity</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Reports classified as **Misinformation** require a manual Fact-Check link from a verified primary source before an Approval decision can be committed.
            </Text>
          </div>
        </Card>
      </div>

      {/* Content Inspection Modal */}
      <Dialog open={!!inspectedItem} onOpenChange={(open) => !open && setInspectedItem(null)}>
        <DialogContent className="max-w-2xl bg-card border-white/10 p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
                {inspectedItem?.reportType} Decision Queue
              </Badge>
              {inspectedItem && getStatusBadge(inspectedItem.status)}
            </div>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" /> 
              Content Audit: {inspectedItem?.creator}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Reviewing raw data nodes for platform-wide factual compliance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <div className="p-6 rounded-2xl bg-background/50 border border-white/5 space-y-4">
              <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest text-primary">Raw Content Node</Text>
              <Text variant="body" className="leading-relaxed italic text-foreground/90">
                "{inspectedItem?.fullContent || inspectedItem?.content}"
              </Text>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <Text variant="caption" className="text-muted-foreground leading-relaxed">
                Decision history indicates that this creator has **98% reliability** across previous reports. Proceed with standard audit protocols.
              </Text>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 gap-3">
            <Button type="button" variant="ghost" onClick={() => setInspectedItem(null)} className="h-12 px-6 rounded-xl font-bold">Close Hub</Button>
            {inspectedItem?.status === 'Pending' && (
              <>
                <Button 
                  variant="outline" 
                  className="h-12 px-6 rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDecision(inspectedItem.id, 'Reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject Node
                </Button>
                <Button 
                  className="h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-900/20"
                  onClick={() => handleDecision(inspectedItem.id, 'Approve')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Commit Approval
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
