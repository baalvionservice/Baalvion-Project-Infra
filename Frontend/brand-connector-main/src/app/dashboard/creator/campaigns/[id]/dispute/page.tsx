
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Upload,
  Send,
  MessageSquare,
  History,
  FileText,
  Info,
  Clock,
  Check,
  ShieldCheck,
  Trash2,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection, useStorage } from '@/firebase';
import { collection, query, where, addDoc, doc, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { DisputeStatus, Dispute } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { disputeSchema } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type DisputeFormValues = z.infer<typeof disputeSchema>;

function DisputeFilingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deliverableId = searchParams.get('deliverableId');
  const campaignId = params.id as string;

  // 1. Check for existing dispute
  const disputeQuery = useMemo(() => {
    if (!currentUser?.id || !campaignId || !db) return null;
    return query(
      collection(db, 'disputes'),
      where('campaignId', '==', campaignId),
      where('creatorId', '==', currentUser.id),
      limit(1)
    );
  }, [db, campaignId, currentUser?.id]);

  const { data: existingDisputes, loading: disputeLoading } = useCollection<Dispute>(disputeQuery);
  const activeDispute = existingDisputes?.[0];

  // 2. Form state
  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      category: 'UNFAIR_REJECTION',
      reason: '',
      proposedResolution: '',
      evidenceUrls: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const id = Math.random().toString(36).substring(7);
    const storageRef = ref(storage!, `disputes/${campaignId}/evidence/${id}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (err) => toast({ variant: 'destructive', title: 'Upload failed' }),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const currentUrls = form.getValues('evidenceUrls') || [];
        form.setValue('evidenceUrls', [...currentUrls, url]);
        setUploadProgress(0);
        toast({ title: 'Evidence attached' });
      }
    );
  };

  const onSubmit = async (values: DisputeFormValues) => {
    if (!currentUser) return;
    setIsSubmitting(true);

    const disputeData = {
      campaignId,
      creatorId: currentUser.id,
      brandId: 'brand_mock_id', // In a real app, fetch from campaign doc
      deliverableId: deliverableId || undefined,
      ...values,
      status: DisputeStatus.FILED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db!, 'disputes'), disputeData);

      // Also notify brand and admin (simulation)
      await addDoc(collection(db!, 'notifications'), {
        userId: 'brand_mock_id',
        title: 'Dispute Filed',
        message: `A creator has filed a dispute for campaign #${campaignId}.`,
        type: 'SYSTEM',
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Dispute Filed Successfully",
        description: "An administrator will review your case shortly.",
      });
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: '/disputes',
        operation: 'create',
        requestResourceData: disputeData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (disputeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mediation Hub</h1>
          <p className="text-slate-500 font-medium">Resolving campaign disagreements with impartiality.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Area */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {!activeDispute ? (
              <motion.div
                key="filing-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="p-8 border-b bg-red-50/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <CardTitle className="text-xl">File a New Dispute</CardTitle>
                    </div>
                    <CardDescription className="mt-2 font-medium">
                      Fill out this form to request administrative review. Escrowed funds will be held until resolution.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-slate-700">Dispute Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none focus:ring-primary">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="UNFAIR_REJECTION" className="font-bold">Unfair Deliverable Rejection</SelectItem>
                                  <SelectItem value="PAYMENT_ISSUE" className="font-bold">Payment or Escrow Delay</SelectItem>
                                  <SelectItem value="SCOPE_CREEP" className="font-bold">Requests outside of Brief</SelectItem>
                                  <SelectItem value="OTHER" className="font-bold">Other Professional Issue</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-slate-700">Detailed Reason</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Explain exactly what happened. Be specific about dates and previous communication."
                                  className="min-h-[150px] rounded-2xl p-6 bg-slate-50 border-none focus-visible:ring-primary text-md"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <Label className="font-bold text-slate-700">Evidence (Screenshots/Chat Logs)</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {(form.watch('evidenceUrls') || []).map((url, i) => (
                              <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group border shadow-sm">
                                <img src={url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button type="button" className="text-white hover:text-red-400" onClick={() => form.setValue('evidenceUrls', form.getValues('evidenceUrls')!.filter((_, idx) => idx !== i))}>
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-primary transition-all group"
                            >
                              <PlusCircle className="h-6 w-6 text-slate-300 group-hover:text-primary mb-2" />
                              <span className="text-[10px] font-black text-slate-400 uppercase">Attach</span>
                            </button>
                            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*" />
                          </div>
                          {uploadProgress > 0 && (
                            <div className="space-y-1">
                              <Progress value={uploadProgress} className="h-1" />
                              <p className="text-[10px] text-primary font-bold uppercase tracking-widest text-right">Uploading Evidence...</p>
                            </div>
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name="proposedResolution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-slate-700">Your Proposed Resolution</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Release 100% of payment as work matches all initial requirements."
                                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-primary font-medium"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
                        >
                          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                          File Official Dispute
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="dispute-status"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Active Dispute Tracker */}
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="p-8 border-b bg-orange-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <CardTitle className="text-xl">Dispute Under Review</CardTitle>
                      </div>
                      <Badge className="bg-orange-100 text-orange-600 border-none uppercase text-[10px] font-black px-3 py-1">
                        Ref: #{activeDispute.id!.substring(0, 8)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="relative py-10">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-1000" style={{ width: activeDispute.status === 'FILED' ? '25%' : activeDispute.status === 'UNDER_REVIEW' ? '50%' : activeDispute.status === 'ADMIN_DECISION' ? '75%' : '100%' }} />

                      <div className="relative flex justify-between">
                        {[
                          { id: 'FILED', label: 'Filed', active: true },
                          { id: 'UNDER_REVIEW', label: 'Reviewing', active: ['UNDER_REVIEW', 'ADMIN_DECISION', 'RESOLVED'].includes(activeDispute.status) },
                          { id: 'ADMIN_DECISION', label: 'Decision', active: ['ADMIN_DECISION', 'RESOLVED'].includes(activeDispute.status) },
                          { id: 'RESOLVED', label: 'Resolved', active: activeDispute.status === 'RESOLVED' }
                        ].map((step, i) => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div className={cn(
                              "h-10 w-10 rounded-full border-4 flex items-center justify-center z-10 transition-colors",
                              step.active ? "bg-primary border-white text-white shadow-lg" : "bg-white border-slate-100 text-slate-300"
                            )}>
                              {step.active ? <Check className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-slate-200" />}
                            </div>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", step.active ? "text-primary" : "text-slate-400")}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" /> Case Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                          <p className="font-medium text-slate-700">{activeDispute.category.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filed On</p>
                          <p className="font-medium text-slate-700">{new Date(activeDispute.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Separator />
                      <p className="text-sm text-slate-600 italic">"{activeDispute.reason}"</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Message Center */}
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" /> Administrator Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    {activeDispute.adminNotes ? (
                      <div className="flex gap-4 items-start">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarFallback className="bg-slate-900 text-white font-black text-xs">AD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-100 relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase text-primary">Baalvion Trust & Safety</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date().toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {activeDispute.adminNotes}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                          <History className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Awaiting Admin Response</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">Cases are usually assigned to a specialist within 24 business hours.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Escrow Protection</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  The full campaign budget is currently **locked** in our secure escrow vault. It will remain there until the dispute is resolved. No parties can access the funds during this time.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold uppercase text-primary tracking-widest mb-1">Status</p>
                <p className="text-lg font-black text-white">FUNDS HELD</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b bg-slate-50/50">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Process Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { title: 'Timeline', desc: 'Disputes are resolved in 3-5 business days.' },
                { title: 'Evidence', desc: 'Include all relevant chat logs and raw work files.' },
                { title: 'Resolution', desc: 'The admin decision is final and legally binding per TOS.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-900 uppercase">{item.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Need more help?</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Read our Dispute Resolution Policy for detailed information on how cases are handled.
              </p>
            </div>
            <Button variant="link" className="text-xs font-bold text-primary h-auto p-0">Read Policy</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function DisputeFilingPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <DisputeFilingContent />
    </React.Suspense>
  );
}
