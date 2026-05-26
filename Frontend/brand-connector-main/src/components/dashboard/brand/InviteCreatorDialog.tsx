
'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Send,
  Loader2,
  IndianRupee,
  MessageSquare,
  CheckCircle2,
  Briefcase,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, addDoc, doc, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Campaign, CampaignStatus, InviteStatus } from '@/types';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui';

interface InviteCreatorDialogProps {
  creator: {
    id: string;
    name: string;
    handle: string;
    image: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteCreatorDialog({ creator, open, onOpenChange }: InviteCreatorDialogProps) {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [budgetOffer, setBudgetOffer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active campaigns for selection
  const campaignsQuery = useMemo(() => {
    if (!currentUser?.id || !db) return null;
    return query(
      collection(db, 'campaigns'),
      where('brandId', '==', `brand_${currentUser.id}`),
      where('status', '==', CampaignStatus.ACTIVE)
    );
  }, [db, currentUser?.id]);

  const { data: campaigns, loading: campaignsLoading } = useCollection<Campaign>(campaignsQuery);

  const handleSendInvite = async () => {
    if (!selectedCampaignId || !currentUser) return;
    setIsSubmitting(true);

    const inviteData = {
      campaignId: selectedCampaignId,
      creatorId: creator.id,
      brandId: `brand_${currentUser.id}`,
      message,
      budgetOffer: Number(budgetOffer.replace(/[^0-9]/g, '')),
      status: InviteStatus.SENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Create Invite Record
      await addDoc(collection(db!, 'invites'), inviteData);

      // 2. Notify Creator
      const notificationData = {
        userId: creator.id,
        title: 'New Campaign Invitation! 🚀',
        message: `${currentUser.displayName} has invited you to join "${campaigns.find(c => c.id === selectedCampaignId)?.title}".`,
        type: 'CAMPAIGN',
        read: false,
        createdAt: new Date().toISOString(),
        link: `/dashboard/creator/campaigns`
      };

      await addDoc(collection(db!, 'notifications'), notificationData);

      toast({
        title: "Invitation Sent!",
        description: `${creator.name} has been notified.`,
      });

      resetAndClose();
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: '/invites',
        operation: 'create',
        requestResourceData: inviteData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedCampaignId('');
    setMessage('');
    setBudgetOffer('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 space-y-8">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Invite to Campaign</DialogTitle>
                <DialogDescription>Pitch your campaign directly to {creator.name}.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Creator Profile Mini */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
            <Avatar className="h-12 w-12 rounded-xl border border-white shadow-sm">
              <AvatarImage src={creator.image} />
              <AvatarFallback>{creator.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-slate-900">{creator.name}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">@{creator.handle}</p>
            </div>
            <Badge className="ml-auto bg-primary/5 text-primary border-none text-[10px] font-black uppercase">Direct Match</Badge>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Select Campaign</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue placeholder={campaignsLoading ? "Loading..." : "Pick an active project"} />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.length > 0 ? (
                    campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-bold">{c.title}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-center text-slate-400 font-bold uppercase">No active campaigns</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Budget Offer (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="e.g. 15,000"
                  className="pl-12 h-14 rounded-2xl bg-slate-50 border-none text-xl font-black focus-visible:ring-primary"
                  value={budgetOffer}
                  onChange={(e) => setBudgetOffer(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Personalized Message</Label>
              <Textarea
                placeholder="Hey! Love your work in tech. We have an exciting campaign for our new hub launch and think you'd be a perfect fit..."
                className="min-h-[120px] rounded-2xl p-6 bg-slate-50 border-none focus-visible:ring-primary text-md resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              disabled={!selectedCampaignId || !budgetOffer || isSubmitting}
              onClick={handleSendInvite}
              className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Send Official Invite
            </Button>
          </div>
        </div>
        <div className="bg-slate-50/50 p-6 border-t flex justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Verified Commercial Proposal
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
