
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Paperclip,
  Send,
  Loader2,
  Calendar,
  History,
  Info,
  Check,
  Download,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DeliverableUpload } from '@/components/dashboard/creator/DeliverableUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { DeliverableStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock Campaign Data for context
const MOCK_ACTIVE_CAMPAIGN = {
  id: '1',
  title: 'AI Smart Home Ecosystem Review',
  brand: {
    name: 'Lumina Tech',
    logo: 'https://picsum.photos/seed/lumina/100/100',
    isVerified: true
  },
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days from now
  budget: '₹45,000',
  briefSummary: 'Create a detailed YouTube review focusing on the energy-saving AI automation features. High aesthetic lifestyle shots required.',
  deliverables: [
    { id: 'del_1', title: 'Main YouTube Video (Draft)', status: 'REVISION_REQUESTED' },
    { id: 'del_2', title: 'Teaser Reel', status: 'APPROVED' },
    { id: 'del_3', title: 'Community Post Assets', status: 'PENDING' }
  ]
};

export default function CreatorCampaignWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const db = useFirestore();

  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(MOCK_ACTIVE_CAMPAIGN.deliverables[0]);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'work' | 'feedb!ack' | 'history'>('work');
  const [uploadedAssets, setUploadedAssets] = useState<any[]>([]);

  // Real-time hook for messages
  const messagesQuery = useMemo(() => {
    return query(
      collection(db!, 'notifications'), 
      where('userId', '==', currentUser?.id || 'anonymous'),
      orderBy('createdAt', 'desc')
    );
  }, [db!, currentUser?.id]);

  const { data: messages } = useCollection<any>(messagesQuery);

  const handleSubmitWork = async () => {
    if (uploadedAssets.length === 0) return toast({ variant: 'destructive', title: 'No files uploaded', description: 'Please add at least one asset to submit.' });
    setIsSubmitting(true);

    // Simulation of workflow persistence
    setTimeout(() => {
      toast({
        title: "Work Submitted!",
        description: "Lumina Tech has been notified for review.",
      });
      setSubmissionNotes('');
      setUploadedAssets([]);
      setIsSubmitting(false);
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-600 border-none">Approved</Badge>;
      case 'SUBMITTED': return <Badge className="bg-blue-100 text-blue-600 border-none">In Review</Badge>;
      case 'REVISION_REQUESTED': return <Badge className="bg-orange-100 text-orange-600 border-none">Revision Requested</Badge>;
      default: return <Badge variant="outline" className="text-slate-400">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Workspace Header */}
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
            <Avatar className="h-12 w-12 rounded-xl border shadow-sm">
              <AvatarImage src={MOCK_ACTIVE_CAMPAIGN.brand.logo} />
              <AvatarFallback>LT</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{MOCK_ACTIVE_CAMPAIGN.title}</h1>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase">Active</Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                with <span className="text-slate-900 font-bold">{MOCK_ACTIVE_CAMPAIGN.brand.name}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Milestone Payment</p>
            <p className="text-xl font-black text-emerald-600">{MOCK_ACTIVE_CAMPAIGN.budget}</p>
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2 hidden sm:block" />
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <Download className="mr-2 h-4 w-4" /> Download Brief
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Brief & Timeline */}
        <aside className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100/50 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-orange-600">Time Remaining</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">4d 12h 30m</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">Submission Deadline: Jul 28</p>
                </div>
                <Progress value={65} className="h-1.5 bg-slate-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Milestone Tracker</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {MOCK_ACTIVE_CAMPAIGN.deliverables.map((del) => (
                  <button 
                    key={del.id}
                    onClick={() => setSelectedDeliverable(del)}
                    className={cn(
                      "w-full text-left p-5 flex items-center justify-between transition-all group",
                      selectedDeliverable.id === del.id ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        del.status === 'APPROVED' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 bg-white"
                      )}>
                        {del.status === 'APPROVED' ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />}
                      </div>
                      <span className={cn(
                        "text-sm font-bold truncate transition-colors",
                        selectedDeliverable.id === del.id ? "text-primary" : "text-slate-600 group-hover:text-slate-900"
                      )}>{del.title}</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-all",
                      selectedDeliverable.id === del.id ? "text-primary translate-x-1" : "text-slate-300 opacity-0 group-hover:opacity-100"
                    )} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">Escrow Status</p>
                  <p className="text-sm font-bold text-white mt-1">Funds Secured</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                The full budget of <strong>{MOCK_ACTIVE_CAMPAIGN.budget}</strong> is currently held in Baalvion Escrow.
              </p>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          
          <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border w-fit">
            {[
              { id: 'work', label: 'Submit Work', icon: Zap },
              { id: 'feedb!ack', label: 'Feedb!ack', icon: MessageSquare },
              { id: 'history', label: 'History', icon: History }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'outline' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-xl font-bold px-6 h-10",
                  activeTab === tab.id && "shadow-sm"
                )}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'work' && (
              <motion.div
                key="work-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="p-8 border-b bg-slate-50/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">Submission Area</CardTitle>
                          {getStatusBadge(selectedDeliverable?.status)}
                        </div>
                        <CardDescription className="font-medium">
                          Manage assets for your active milestones
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="w-fit h-7 font-bold border-slate-200">
                        Campaign ID: #{params.id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    {/* Deliverable Upload Component */}
                    <DeliverableUpload 
                      campaignId={params.id as string}
                      deliverableTypes={MOCK_ACTIVE_CAMPAIGN.deliverables.map(d => d.title)}
                      onAssetsChange={setUploadedAssets}
                    />

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-black uppercase text-slate-400 tracking-widest">Creator Notes</label>
                        <Badge variant="default" className="text-[10px] text-slate-400 font-bold uppercase">Briefing context</Badge>
                      </div>
                      <Textarea 
                        placeholder="Add context for the brand. e.g. 'I focused on the kitchen automation scenes as discussed.'" 
                        className="min-h-[120px] rounded-2xl p-6 bg-slate-50 border-slate-200 focus-visible:ring-primary text-md"
                        value={submissionNotes}
                        onChange={(e) => setSubmissionNotes(e.target.value)}
                      />
                    </div>

                    {selectedDeliverable.status === 'REVISION_REQUESTED' && (
                      <div className="p-6 rounded-[2rem] bg-orange-50 border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-orange-900">Unfair Rejection?</p>
                            <p className="text-xs text-orange-700 font-medium">If the brand is asking for work outside the original brief, you can file a dispute.</p>
                          </div>
                        </div>
                        <Link href={`/dashboard/creator/campaigns/${params.id}/dispute?deliverableId=${selectedDeliverable.id}`}>
                          <Button variant="outline" className="rounded-xl font-bold bg-white border-orange-200 text-orange-600 hover:bg-orange-100">
                            File Dispute
                          </Button>
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                      <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        Assets are timestamped and verified by Baalvion AI. Submitting for approval starts the brand review period.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 bg-slate-50/50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button variant="ghost" className="rounded-xl font-bold h-12 px-6 text-slate-400">
                      Draft Saved Locally
                    </Button>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Button 
                        disabled={uploadedAssets.length === 0 || isSubmitting}
                        onClick={handleSubmitWork}
                        className="rounded-xl font-bold h-12 px-10 shadow-xl shadow-primary/20 flex-1 sm:flex-none"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" /> Submit Submission</>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>

                <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white border border-slate-100">
                  <CardHeader className="p-6 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-400">
                      <Paperclip className="h-4 w-4" /> Visual Requirements Reference
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Brand Objectives</h4>
                        <ul className="space-y-2">
                          <li className="flex gap-2 text-sm text-slate-600 font-medium">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            Highlight the 20% energy saving mode.
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Safe Zones</h4>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 text-orange-700 text-xs font-bold">
                          <ShieldAlert className="h-4 w-4" />
                          Avoid logos of competitors in the background.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'feedb!ack' && (
              <motion.div
                key="feedb!ack-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="border-b p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Collaborator Feedb!ack</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 h-[400px] flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <MessageSquare className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No brand feedb!ack yet</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                      When Lumina Tech reviews your submissions, their comments and revision requests will appear here.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6"
              >
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="border-b p-6">
                    <CardTitle className="text-lg">Submission History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {[
                        { v: '1.0', event: 'Initial Draft Created', date: '2 days ago' },
                        { v: '0.9', event: 'Contract Accepted', date: '3 days ago' },
                      ].map((item, i) => (
                        <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                              <History className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{item.event}</p>
                              <p className="text-xs text-slate-400 font-medium">Version {item.v} • {item.date}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
