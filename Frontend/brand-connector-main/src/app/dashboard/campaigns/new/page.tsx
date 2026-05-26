'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  LayoutGrid, 
  Target, 
  CheckCircle2,
  Loader2,
  Zap,
  Rocket,
  FileText,
  ListPlus,
  X,
  PlusCircle,
  TrendingUp as TrendingIcon,
  IndianRupee
} from 'lucide-react';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CampaignStatus, CampaignDeliverable, Campaign } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { predictROI } from '@/lib/ai/roi';
import CountUp from 'react-countup';
import { 
  campaignBasicsSchema, 
  creatorRequirementsSchema, 
  budgetTimelineSchema, 
  guidelinesSchema 
} from '@/lib/validations';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CREATOR_NICHES, PLATFORM_FEE_PERCENTAGE } from '@/constants';

// Dynamically import RichTextEditor and Particles for performance
const RichTextEditor = dynamic(() => import('@/components/ui/rich-text-editor').then(mod => mod.RichTextEditor), { 
  ssr: false,
  loading: () => <SkeletonEditor />
});

const Particles = dynamic(() => import("@tsparticles/react"), { ssr: false });

function SkeletonEditor() {
  return <div className="h-[250px] w-full rounded-xl bg-slate-100 animate-pulse" />;
}

type CampaignBasicsValues = z.infer<typeof campaignBasicsSchema>;
type CreatorRequirementsValues = z.infer<typeof creatorRequirementsSchema>;
type BudgetTimelineValues = z.infer<typeof budgetTimelineSchema>;
type GuidelinesValues = z.infer<typeof guidelinesSchema>;

const STEPS = [
  { id: 1, title: 'Basics', icon: LayoutGrid },
  { id: 2, title: 'Target', icon: Target },
  { id: 3, title: 'Budget', icon: Sparkles },
  { id: 4, title: 'Rules', icon: FileText },
  { id: 5, title: 'Publish', icon: Rocket },
];

const OBJECTIVES = [
  { id: 'AWARENESS', label: 'Brand Awareness', desc: 'Reach as many people as possible.' },
  { id: 'ENGAGEMENT', label: 'Engagement', desc: 'Get likes, comments, and shares.' },
  { id: 'CONVERSIONS', label: 'Conversions', desc: 'Drive sales or sign-ups.' },
  { id: 'CONTENT', label: 'Content Creation', desc: 'Get high-quality raw assets.' },
];

const TIERS = [
  { id: 'NANO', label: 'Nano', range: '< 10k', desc: 'Hyper-engaged micro communities.' },
  { id: 'MICRO', label: 'Micro', range: '10k - 50k', desc: 'Niche authority & trust.' },
  { id: 'MID', label: 'Mid-Tier', range: '50k - 500k', desc: 'Professional reach.' },
  { id: 'MACRO', label: 'Macro', range: '500k+', desc: 'Mass market visibility.' },
];

function NewCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceId = searchParams.get('sourceId');
  const db = useFirestore();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form initialization
  const basicsForm = useForm<CampaignBasicsValues>({
    resolver: zodResolver(campaignBasicsSchema),
    defaultValues: { title: '', objective: 'AWARENESS', platforms: ['Instagram'], contentType: 'REEL', description: '' },
  });

  const requirementsForm = useForm<CreatorRequirementsValues>({
    resolver: zodResolver(creatorRequirementsSchema),
    defaultValues: { creatorTier: 'MICRO', minFollowers: 10000, maxFollowers: 50000, minEngagementRate: 3, niches: [], targetLocations: ['India'], languages: ['English'], audienceAgeMin: 18, audienceAgeMax: 35, audienceGender: 'ALL', minPosts: 1, isExclusive: false },
  });

  const budgetForm = useForm<BudgetTimelineValues>({
    resolver: zodResolver(budgetTimelineSchema),
    defaultValues: { totalBudget: 50000, budgetPerCreator: [5000, 15000], paymentMethod: 'UPI', startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 30), applicationDeadline: new Date(Date.now() + 86400000 * 7), submissionDeadline: new Date(Date.now() + 86400000 * 21), postLiveDate: new Date(Date.now() + 86400000 * 25) },
  });

  const guidelinesForm = useForm<GuidelinesValues>({
    resolver: zodResolver(guidelinesSchema),
    defaultValues: { deliverables: [], dos: [], donts: [], hashtags: [], handles: [], links: [], mandatoryMentions: '' },
  });

  const handleNextStep = useCallback(async () => {
    // Shared validation logic could go here
  }, []);

  const onBasicsSubmit = async (values: CampaignBasicsValues) => {
    if (!currentUser) return;
    setIsSaving(true);

    const campaignData = {
      brandId: `brand_${currentUser.id}`,
      title: values.title,
      description: values.description,
      objectives: [values.objective],
      status: CampaignStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      step: 1
    };

    try {
      if (campaignId) {
        await updateDoc(doc(db!, 'campaigns', campaignId), campaignData);
      } else {
        const docRef = await addDoc(collection(db!, 'campaigns'), campaignData);
        setCampaignId(docRef.id);
      }
      toast({ title: "Progress Saved" });
      setCurrentStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ROI Forecast - useMemo to prevent expensive calculation on every render
  const roiForecast = useMemo(() => {
    const budget = budgetForm.watch('totalBudget') || 0;
    if (budget < 500) return null;

    return predictROI({
      budget,
      niche: requirementsForm.watch('niches')[0] || 'Tech & Gadgets',
      contentType: basicsForm.watch('contentType') as any,
      creatorTier: requirementsForm.watch('creatorTier')
    });
  }, [
    budgetForm.watch('totalBudget'),
    requirementsForm.watch('niches'),
    requirementsForm.watch('creatorTier'),
    basicsForm.watch('contentType')
  ]);

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header & Stepper UI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-black text-slate-900">Create Campaign</h1>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                currentStep === s.id ? "border-primary bg-primary/5 text-primary scale-110 shadow-md" : 
                currentStep > s.id ? "border-green-500 bg-green-50 text-green-500" : "border-slate-200 bg-white text-slate-400"
              )}>
                {currentStep > s.id ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white max-w-4xl mx-auto">
              <CardHeader className="p-8 border-b bg-slate-50/30">
                <CardTitle className="text-xl">Step 1: Basics</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form id="basics-form" onSubmit={basicsForm.handleSubmit(onBasicsSubmit)} className="space-y-8">
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Campaign Name</Label>
                    <Input placeholder="e.g. Summer AI Tech Launch" className="h-12 rounded-xl" {...basicsForm.register('title')} />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700">Detailed Brief</Label>
                    <RichTextEditor 
                      value={basicsForm.watch('description')} 
                      onChange={(v) => basicsForm.setValue('description', v)} 
                      placeholder="Explain your vision..." 
                    />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="p-8 border-t bg-slate-50/50 flex justify-end">
                <Button form="basics-form" disabled={isSaving} className="rounded-xl font-black px-10 h-12">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
        {/* Additional steps... */}
      </AnimatePresence>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <NewCampaignContent />
    </React.Suspense>
  );
}
