
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Zap,
  Calendar,
  IndianRupee,
  Clock,
  Target,
  Info,
  ShieldCheck,
  FileText,
  Users,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Send,
  Star,
  Globe,
  Loader2,
  Sparkles,
  Paperclip,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, query, where, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ApplicationStatus, Campaign } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CampaignHealthMonitor } from '@/components/campaigns/HealthMonitor';
import { cn } from '@/lib/utils';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const db = useFirestore();

  // 1. Fetch Real-time Campaign Data
  const { data: campaign, loading: campaignLoading } = useDoc<Campaign>(`campaigns/${params.id}`);

  const [isSubmitting, setIsSaving] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitch, setPitch] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [timeline, setTimeline] = useState('');
  const [isApplied, setIsApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  // 2. Check for existing application
  const applicationsQuery = useMemo(() => {
    if (!currentUser?.id || !params.id) return null;
    return query(
      collection(db!, 'applications'),
      where('campaignId', '==', params.id as string),
      where('creatorId', '==', currentUser.id)
    );
  }, [db!, currentUser?.id, params.id]);

  const { data: userApplications, loading: appsLoading } = useCollection<any>(applicationsQuery);

  useEffect(() => {
    if (userApplications && userApplications.length > 0) {
      setIsApplied(true);
      setExistingApplication(userApplications[0]);
    }
  }, [userApplications]);

  const generateAIPitch = () => {
    setIsGeneratingPitch(true);
    setTimeout(() => {
      const generated = `Hey! I've been following your brand for a while and I'm a huge fan. My audience loves deep-dive tech reviews, and I can definitely highlight your key features. I plan to film this in my minimalist home setup. Let's make this go viral!`;
      setPitch(generated);
      setIsGeneratingPitch(false);
      toast({
        title: "AI Pitch Generated",
        description: "Review and customize it to match your voice.",
      });
    }, 2000);
  };

  const handleApplySubmit = async () => {
    if (!currentUser || !campaign) return;
    setIsSaving(true);

    const applicationData = {
      campaignId: campaign.id,
      creatorId: currentUser.id,
      status: ApplicationStatus.PENDING,
      pitch,
      proposedBudget: Number(proposedRate.replace(/[^0-9]/g, '')),
      proposedTimeline: timeline,
      appliedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db!, 'applications'), applicationData);
      setIsApplied(true);
      toast({
        title: "Application Sent!",
        description: "Brand has been notified.",
      });
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: '/applications',
        operation: 'create',
        requestResourceData: applicationData
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-600';
      case 'REVIEWING': return 'bg-blue-100 text-blue-600';
      case 'ACCEPTED': return 'bg-emerald-100 text-emerald-600';
      case 'REJECTED': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (campaignLoading || appsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-3xl font-black">Campaign Not Found</h1>
        <p className="text-slate-500 mt-2">The project you're looking for may have been archived.</p>
        <Button onClick={() => router.back()} className="mt-6 rounded-xl font-bold">Return Back</Button>
      </div>
    );
  }

  const isBrandOwner = currentUser?.role === 'BRAND' && campaign.brandId === `brand_${currentUser.id}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navigation Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
        <div className="container h-16 flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-lg border">
                <AvatarImage src={`https://picsum.photos/seed/${campaign.brandId}/100/100`} />
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
              <h1 className="text-sm font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">
                {campaign.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Escrow Secured</span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mt-8 px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">

        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">

          {isBrandOwner && (
            <section>
              <CampaignHealthMonitor campaignId={campaign.id} />
            </section>
          )}

          {/* Hero Brief Card */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="p-8 md:p-10 bg-slate-50/50 border-b">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold uppercase text-[10px]">
                      {campaign.niches?.[0] || 'Marketing'}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50/50 font-bold text-[10px] uppercase">
                      {campaign.status}
                    </Badge>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                    {campaign.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">Target: </span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-black text-[10px] uppercase">{campaign.creatorTier || 'MICRO'}</Badge>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Budget</p>
                  <p className="text-3xl font-black text-primary">₹{campaign.budget?.toLocaleString()}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-1 text-emerald-600">
                    <Zap className="h-3 w-3 fill-current" />
                    <span className="text-[10px] font-black uppercase">₹{campaign.escrowBalance || 0} Locked</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 md:p-10 space-y-10">
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Campaign Objective
                </h3>
                <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: campaign.description }} />
              </div>

              <Separator />

              {/* Required Deliverables */}
              <div className="space-y-6 pt-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Required Deliverables
                </h3>
                <div className="space-y-3">
                  {campaign.deliverables?.map((del, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-primary/20 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-black shadow-inner">
                          {del.qty}x
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{del.type}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{del.platform}</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-100 text-slate-500 border-none font-bold uppercase text-[9px] py-0 px-2 h-5">PENDING HIRES</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application UI */}
          {currentUser?.role === 'CREATOR' && !isApplied && (
            <Card className="border-none shadow-xl shadow-primary/10 rounded-[2rem] overflow-hidden bg-white ring-1 ring-primary/20">
              <CardHeader className="p-8 md:p-10 border-b bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Submit Application</CardTitle>
                    <CardDescription>Tell the brand why you're the perfect fit.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4 gap-2" onClick={generateAIPitch} disabled={isGeneratingPitch}>
                    {isGeneratingPitch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    AI Assistant
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 md:p-10 space-y-8">
                <div className="space-y-4">
                  <Label className="font-bold">Your Creative Pitch</Label>
                  <Textarea
                    placeholder="Share your vision for this campaign..."
                    className="min-h-[180px] rounded-2xl p-6 bg-slate-50 border-slate-200 focus-visible:ring-primary text-md"
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="font-bold">Proposed Rate (₹)</Label>
                    <Input
                      placeholder="e.g. 15,000"
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="font-bold">Timeline</Label>
                    <Input
                      placeholder="e.g. 10 days"
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  disabled={!pitch || !proposedRate || !timeline || isSubmitting}
                  onClick={handleApplySubmit}
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                  Submit Application
                </Button>
              </CardContent>
            </Card>
          )}

          {isApplied && (
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b bg-emerald-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Application Status</CardTitle>
                    <p className="text-sm text-emerald-700 font-medium">Funds for this campaign are already secured in escrow.</p>
                  </div>
                  <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[10px] uppercase border-none", getStatusColor(existingApplication?.status))}>
                    {existingApplication?.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 text-center py-12">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Your pitch is being reviewed</h4>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">We'll notify you as soon as the brand makes a decision.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <ShieldCheck className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">Escrow Guarantee</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Baalvion Connect holds 100% of the campaign budget in a secure vault. Payouts are automatically authorized upon content approval.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Locked Funds</p>
                  <p className="text-xl font-black">₹{campaign.escrowBalance || 0}</p>
                </div>
                <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] uppercase h-5">VERIFIED</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b p-6 bg-slate-50/50">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Applications Close</span>
                <span className="font-black text-slate-900">{new Date(campaign.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Start Date</span>
                <span className="font-black text-slate-900">{new Date(campaign.startDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
