
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  MailOpen,
  Loader2,
  IndianRupee,
  MoreHorizontal,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Check,
  Zap
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { InviteStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Mock mapping for creator metadata
const CREATOR_MAP: Record<string, any> = {
  'creator_1': { name: 'Sarah Chen', handle: '@sarah_tech', avatar: 'https://picsum.photos/seed/sarah/100/100' },
  'creator_2': { name: 'Alex Rivers', handle: '@alex_creates', avatar: 'https://picsum.photos/seed/alex/100/100' },
};

export default function CampaignInvitesPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const campaignId = params.id as string;

  // 1. Fetch Invites
  const invitesQuery = useMemo(() => {
    return query(
      collection(db!, 'invites'),
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc')
    );
  }, [db!, campaignId]);

  const { data: invites, loading } = useCollection<any>(invitesQuery);

  const getStatusConfig = (status: InviteStatus) => {
    switch (status) {
      case InviteStatus.SENT: return { label: 'Sent', color: 'bg-slate-100 text-slate-600', icon: Send };
      case InviteStatus.OPENED: return { label: 'Opened', color: 'bg-blue-100 text-blue-600', icon: MailOpen };
      case InviteStatus.ACCEPTED: return { label: 'Accepted', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 };
      case InviteStatus.DECLINED: return { label: 'Declined', color: 'bg-red-100 text-red-600', icon: XCircle };
      default: return { label: status, color: 'bg-slate-100 text-slate-600', icon: Send };
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      await deleteDoc(doc(db!, 'invites', id));
      toast({ title: "Invite rescinded" });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error cancelling invite' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Direct Invitations</h1>
            <p className="text-slate-500 font-medium">Track performance of proactively sourced talent for campaign #{campaignId.substring(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase h-10 px-4 rounded-xl flex items-center gap-2">
            <Send className="h-4 w-4" /> {invites.length} Direct Invites
          </Badge>
        </div>
      </div>

      {/* Invites Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">Creator</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Offer Budget</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Sent Date</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {invites.length > 0 ? (
                  invites.map((invite, idx) => {
                    const meta = CREATOR_MAP[invite.creatorId] || { name: 'Invited Creator', handle: '@user', avatar: '' };
                    const status = getStatusConfig(invite.status);

                    return (
                      <motion.tr
                        key={invite.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24"
                      >
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 rounded-xl border border-white shadow-sm ring-2 ring-slate-50">
                              <AvatarImage src={meta.avatar} />
                              <AvatarFallback>{meta.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-black text-slate-900 leading-none">{meta.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">{meta.handle}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-black text-slate-900">₹{invite.budgetOffer.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border-none", status.color)}>
                            <status.icon className="h-3 w-3 mr-1.5" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600">{new Date(invite.createdAt).toLocaleDateString()}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(invite.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {invite.status === InviteStatus.SENT && (
                              <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg font-bold text-red-500 hover:bg-red-50" onClick={() => handleCancelInvite(invite.id)}>Rescind</Button>
                            )}
                            <Button variant="outline" size="sm" className="h-9 rounded-lg font-bold text-xs bg-white">Message</Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                          <Send className="h-8 w-8 text-slate-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-900 font-bold">No direct invites sent yet</p>
                          <p className="text-slate-400 text-sm">Discover top talent and invite them to your campaign to boost conversion.</p>
                        </div>
                        <Button className="rounded-xl font-bold px-8 h-11" onClick={() => router.push('/dashboard/brand/creators')}>Discover Creators</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contextual Advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-indigo-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
          <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
            <Zap className="h-8 w-8 text-yellow-300 fill-yellow-300" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold">Pro Tip: Direct Conversion</h3>
            <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
              Direct invitations have a <strong>3.2x higher acceptance rate</strong> than open application calls. Use personalized messages referencing specific creator work samples.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
            <Clock className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Response Tracking</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              We track when creators open your invite email and in-app alert. Most creators respond within <strong>18 business hours</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
