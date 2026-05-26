
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  AlertCircle, 
  Download,
  ExternalLink,
  Loader2,
  Check,
  X,
  History,
  FileText,
  Play,
  Maximize2,
  Info,
  ShieldAlert,
  Calendar,
  IndianRupee,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Star
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { DeliverableStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui';

// Mock Data for the prototype
const MOCK_DELIVERABLE = {
  id: 'del_1',
  title: 'AI Smart Home Review - Final Edit',
  description: 'Detailed unboxing and automation routines setup video (8:45 duration). High aesthetic lifestyle lighting used as requested.',
  status: 'SUBMITTED',
  submissionUrl: 'https://picsum.photos/seed/tech-review/1200/800', // Mocking image as video preview
  mediaType: 'VIDEO',
  submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  creatorId: 'creator_1',
  campaignId: 'camp_1',
  proposedBudget: 45000,
  history: [
    { v: '1.0', event: 'Initial Draft', date: '2 days ago', note: 'Standard intro + setup scenes.' },
    { v: '1.1', event: 'Audio Fix', date: 'Yesterday', note: 'Enhanced audio levels for voiceover.' }
  ]
};

const MOCK_CAMPAIGN_REF = {
  id: 'camp_1',
  title: 'AI Smart Home Ecosystem Review',
  objectives: ['Highlight energy saving mode', 'Show mobile app automation'],
  dos: ['Mention "Energy Save" twice', 'Natural home lighting'],
  donts: ['No competitor mentions', 'Avoid heavy filters'],
  hashtags: ['#LuminaAI', '#SmartHomeReview'],
  approvalDeadline: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString() // 48 hours left
};

const MOCK_CREATOR = {
  id: 'creator_1',
  name: 'Sarah Chen',
  avatar: 'https://picsum.photos/seed/sarah/100/100',
  rating: 4.9,
  completedCampaigns: 42
};

export default function DeliverableReviewWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const db = useFirestore();

  const [isApproving, setIsApproving] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const deliverable = MOCK_DELIVERABLE; // Use mock for prototype
  const campaign = MOCK_CAMPAIGN_REF;
  const creator = MOCK_CREATOR;

  const handleApprove = async () => {
    setIsApproving(true);
    
    const updateData = {
      status: 'APPROVED',
      updatedAt: new Date().toISOString()
    };

    // Non-await mutation pattern
    updateDoc(doc(db!, 'deliverables', params.id as string), updateData)
      .then(() => {
        // Notify Creator
        addDoc(collection(db!, 'notifications'), {
          userId: creator.id,
          title: 'Work Approved! 🎉',
          message: `Your deliverable "${deliverable.title}" has been approved. Payout is being processed.`,
          type: 'PAYMENT',
          read: false,
          createdAt: new Date().toISOString(),
          link: `/dashboard/creator/wallet`
        });

        toast({ title: "Work Approved", description: "Escrow funds have been released to the creator." });
        setTimeout(() => router.push('/dashboard/brand/deliverables'), 2000);
      })
      .catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: `/deliverables/${params.id}`,
          operation: 'update',
          requestResourceData: updateData
        }));
        setIsApproving(false);
      });
  };

  const handleSubmitAction = async (status: 'REVISION_REQUESTED' | 'REJECTED') => {
    if (!feedback.trim()) return;
    setIsSubmittingFeedback(true);

    const updateData = {
      status,
      feedback,
      updatedAt: new Date().toISOString()
    };

    updateDoc(doc(db!, 'deliverables', params.id as string), updateData)
      .then(() => {
        addDoc(collection(db!, 'notifications'), {
          userId: creator.id,
          title: status === 'REVISION_REQUESTED' ? 'Revision Requested' : 'Submission Rejected',
          message: `Update on "${deliverable.title}": ${feedback.substring(0, 50)}...`,
          type: 'CAMPAIGN',
          read: false,
          createdAt: new Date().toISOString(),
          link: `/dashboard/creator/campaigns/${campaign.id}/work`
        });

        toast({ 
          title: status === 'REVISION_REQUESTED' ? "Revision requested" : "Work rejected", 
          description: "Creator has been notified with your feedback." 
        });
        setIsRevisionOpen(false);
        setIsRejectOpen(false);
        setFeedback('');
        setTimeout(() => router.push('/dashboard/brand/deliverables'), 2000);
      })
      .catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: `/deliverables/${params.id}`,
          operation: 'update',
          requestResourceData: updateData
        }));
        setIsSubmittingFeedback(false);
      });
  };

  const timeRemaining = useMemo(() => {
    const diff = new Date(campaign.approvalDeadline).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours;
  }, [campaign.approvalDeadline]);

  return (
    <div className="space-y-8 pb-20">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{deliverable.title}</h1>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[10px] font-black uppercase">Pending Approval</Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                Campaign: <span className="text-slate-900 font-bold">{campaign.title}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Secured Escrow</p>
            <p className="text-xl font-black text-emerald-600">₹{deliverable.proposedBudget.toLocaleString()}</p>
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2 hidden sm:block" />
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <Download className="mr-2 h-4 w-4" /> Download File
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Review Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Media Preview Card */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-slate-950 relative group">
            <div className="aspect-video relative flex items-center justify-center">
              <img 
                src={deliverable.submissionUrl} 
                className="w-full h-full object-cover opacity-60 blur-[2px]" 
                alt="Work Preview"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button className="h-20 w-20 rounded-full bg-white text-primary hover:scale-110 transition-transform shadow-2xl">
                  <Play className="h-10 w-10 fill-current ml-1" />
                </Button>
              </div>
              
              {/* Media Controls Bar Overlay */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black">VIDEO 4K</Badge>
                  <span className="text-xs font-bold text-white">08:45 Duration</span>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-lg">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Action Hub */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Review Decision</CardTitle>
                <CardDescription>Approving releases funds instantly to the creator.</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-100">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">{timeRemaining}h to Approve</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex flex-col md:flex-row gap-4">
              <Button 
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
              >
                {isApproving ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="mr-2 h-6 w-6" />}
                Approve & Pay
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsRevisionOpen(true)}
                className="flex-1 h-16 rounded-2xl text-lg font-bold border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
              >
                <MessageSquare className="mr-2 h-6 w-6" />
                Request Revision
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setIsRejectOpen(true)}
                className="h-16 rounded-2xl font-bold text-red-400 hover:text-red-600 hover:bg-red-50 px-8"
              >
                <X className="mr-2 h-5 w-5" />
                Reject
              </Button>
            </CardContent>
          </Card>

          {/* Submission Details & History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-6 border-b">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Creator Note</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                  "{deliverable.description}"
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-6 border-b">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Revision History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {deliverable.history.map((item, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold border-none text-[9px] h-5">V{item.v}</Badge>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.event}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-300">
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar: Brief Reference */}
        <aside className="lg:col-span-4 space-y-8 sticky top-24">
          
          {/* Creator Profile Mini */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-2xl border shadow-sm">
                  <AvatarImage src={creator.avatar} />
                  <AvatarFallback>C</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-black text-slate-900">{creator.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-slate-500">{creator.rating} • {creator.completedCampaigns} Jobs</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto rounded-full text-primary" asChild>
                  <Link href={`/creator/${creator.name.toLowerCase().replace(' ', '_')}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* The Brief Checklist */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b border-primary/10 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Compliance Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Must Include</p>
                <ul className="space-y-3">
                  {campaign.objectives.map((obj, i) => (
                    <li key={i} className="flex gap-3 text-xs font-medium text-slate-600">
                      <div className="h-4 w-4 rounded-full border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                      </div>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dos</p>
                </div>
                <ul className="space-y-2">
                  {campaign.dos.map((item, i) => (
                    <li key={i} className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Don'ts</p>
                </div>
                <ul className="space-y-2">
                  {campaign.donts.map((item, i) => (
                    <li key={i} className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <X className="h-3 w-3 text-red-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* AI Strategy Insights */}
          <div className="p-6 rounded-[2rem] bg-indigo-900 text-white relative overflow-hidden group">
            <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">AI Quality Scan</span>
              </div>
              <p className="text-xs font-medium leading-relaxed">
                Brand audio is clear. Product lighting matches your aesthetic palette. High overlap with target audience sentiment detected.
              </p>
              <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase">92% Quality Score</Badge>
            </div>
          </div>

        </aside>
      </div>

      {/* Revision Dialog */}
      <Dialog open={isRevisionOpen} onOpenChange={setIsRevisionOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-lg border-none shadow-2xl">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-2xl font-black">Request Changes</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2 font-medium">
              Explain clearly what needs to be adjusted. The creator will be notified to submit a new version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <Label className="font-bold text-slate-700">Revision Notes</Label>
            <Textarea 
              placeholder="e.g. Please increase the focus on the AI setup app interface around the 2:30 mark." 
              className="min-h-[150px] rounded-2xl p-6 bg-slate-50 border-none focus-visible:ring-orange-500 text-md"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsRevisionOpen(false)}>Cancel</Button>
            <Button 
              disabled={!feedback.trim() || isSubmittingFeedback}
              onClick={() => handleSubmitAction('REVISION_REQUESTED')}
              className="rounded-xl font-bold bg-orange-600 hover:bg-orange-700 px-8"
            >
              {isSubmittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-lg border-none shadow-2xl">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-red-600">Reject Submission</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2 font-medium">
              Only reject if the work completely fails to meet the brief. A formal rejection may trigger a dispute review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <Label className="font-bold text-slate-700">Rejection Reason</Label>
            <Textarea 
              placeholder="Specify the exact non-compliance with the initial brief." 
              className="min-h-[150px] rounded-2xl p-6 bg-red-50/30 border-none focus-visible:ring-red-500 text-md"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button 
              disabled={!feedback.trim() || isSubmittingFeedback}
              onClick={() => handleSubmitAction('REJECTED')}
              variant="danger"
              className="rounded-xl font-bold px-8"
            >
              {isSubmittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
