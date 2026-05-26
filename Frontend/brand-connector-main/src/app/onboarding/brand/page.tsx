
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  CheckCircle2,
  CreditCard,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  Users,
  Target,
  IndianRupee,
  ShieldCheck,
  Briefcase,
  Star,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { BrandProfile, OnboardingStatus, CampaignStatus } from '@/types';
import { setAuthCookies } from '@/lib/auth-cookies';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Badge } from '@/components/ui';

const STEPS = [
  { id: 1, title: 'Guidelines', icon: Star },
  { id: 2, title: 'Billing', icon: CreditCard },
  { id: 3, title: 'First Campaign', icon: Briefcase },
  { id: 4, title: 'Invite Team', icon: Users },
];

export default function BrandOnboardingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const brandId = currentUser?.id ? `brand_${currentUser.id}` : null;
  const { data: brand, loading: brandLoading } = useDoc<BrandProfile>(
    brandId ? `brands/${brandId}` : null
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [particlesInit, setParticlesInit] = useState(false);

  // Form states
  const [guidelines, setGuidelines] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBudget, setCampaignBudget] = useState('');
  const [teamEmail, setTeamEmail] = useState('');

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesInit(true));
  }, []);

  useEffect(() => {
    if (brand && brand.onboardingStep) {
      setCurrentStep(brand.onboardingStep);
      setGuidelines(brand.brandGuidelines || '');
    }
  }, [brand]);

  const updateOnboarding = async (nextStep: number, isFinal = false) => {
    if (!brandId) return;

    setIsSaving(true);
    try {
      const updateData: Partial<BrandProfile> = {
        onboardingStep: nextStep,
        onboardingStatus: isFinal ? OnboardingStatus.COMPLETED : OnboardingStatus.IN_PROGRESS,
        brandGuidelines: guidelines,
        updatedAt: new Date().toISOString()
      };

      if (currentStep === 2) {
        updateData.billingMethod = { type: 'CARD', last4: '4242', brand: 'Visa' };
      }

      await updateDoc(doc(db!, 'brands', brandId), updateData);

      if (currentStep === 3 && campaignTitle) {
        await addDoc(collection(db!, 'campaigns'), {
          brandId: brandId,
          title: campaignTitle,
          budget: Number(campaignBudget),
          status: CampaignStatus.DRAFT,
          createdAt: new Date().toISOString()
        });
      }

      if (isFinal) {
        // Sync onboarded state to cookies for middleware
        setAuthCookies({ onboarded: true });
        setShowConfetti(true);
        toast({ title: "Brand Verified!", description: "You're all set to discover creators." });
        setTimeout(() => router.push('/dashboard/brand'), 3000);
      } else {
        setCurrentStep(nextStep);
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Setup error", description: "Failed to save progress." });
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => updateOnboarding(currentStep + 1);
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));
  const finishOnboarding = () => updateOnboarding(currentStep, true);

  if (authLoading || brandLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      {showConfetti && particlesInit && (
        <Particles
          id="confetti"
          options={{
            fullScreen: { zIndex: 100 },
            particles: {
              number: { value: 0 },
              color: { value: ["#6C3AE8", "#F97316", "#10B981"] },
              shape: { type: ["circle", "square"] },
              opacity: { value: 1 },
              size: { value: { min: 2, max: 4 } },
              move: {
                enable: true,
                gravity: { enable: true, acceleration: 10 },
                speed: { min: 10, max: 20 },
                decay: 0.1,
                direction: "top",
                straight: false,
                outModes: { default: "destroy", top: "none" },
              },
            },
            emitters: [
              {
                direction: "top-right",
                rate: { count: 10, delay: 0.1 },
                position: { x: 0, y: 100 },
                size: { width: 0, height: 0 },
              },
              {
                direction: "top-left",
                rate: { count: 10, delay: 0.1 },
                position: { x: 100, y: 100 },
                size: { width: 0, height: 0 },
              },
            ],
          }}
        />
      )}

      <div className="w-full max-w-3xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-primary p-2 rounded-xl">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-slate-900">Finalizing Brand Profile</h1>
          <p className="text-slate-500 max-w-md">Let's set up your campaign workspace so you can start hiring the best creators.</p>
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
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest hidden sm:block",
                  currentStep === s.id ? "text-primary" : "text-slate-400"
                )}>{s.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2 bg-slate-200" />
        </div>

        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
          <CardContent className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="guidelines"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold">Brand Guidelines</h3>
                    <p className="text-slate-500">Creators use these to ensure content matches your aesthetic.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200">
                        <Star className="h-8 w-8 text-slate-300" />
                      </div>
                      <div>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold">Upload Logo</Button>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">PNG or SVG, Max 2MB</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Guidelines Summary</Label>
                      <Textarea
                        placeholder="e.g. Minimalist, high-energy, focuses on sustainability, avoid dark backgrounds..."
                        className="rounded-xl min-h-[120px] resize-none"
                        value={guidelines}
                        onChange={(e) => setGuidelines(e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">Billing Verification</h3>
                    <p className="text-slate-500">Add a payment method to verify your account and start hiring.</p>
                  </div>

                  <div className="max-w-md mx-auto space-y-6">
                    <div className="p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Card Number</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input disabled value="•••• •••• •••• 4242" className="pl-10 bg-white border-slate-200 rounded-xl h-11" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-400">Expiry</Label>
                          <Input disabled value="12 / 26" className="bg-white border-slate-200 rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-400">CVC</Label>
                          <Input disabled value="•••" className="bg-white border-slate-200 rounded-xl h-11" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary/5 rounded-2xl p-4 flex gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                      <p className="text-xs text-slate-600">Secure connection to Stripe. Your data is encrypted and never stored on our servers.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="campaign"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">Your First Campaign</h3>
                    <p className="text-slate-500">Draft a quick brief to see how matching works.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Campaign Title</Label>
                      <Input
                        placeholder="e.g. Summer Collection Launch 2024"
                        className="rounded-xl h-12"
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Estimated Budget</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <Input
                          type="number"
                          placeholder="50,000"
                          className="pl-10 rounded-xl h-12"
                          value={campaignBudget}
                          onChange={(e) => setCampaignBudget(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">Invite Your Team</h3>
                    <p className="text-slate-500">Add marketing managers or colleagues to your brand workspace.</p>
                  </div>

                  <div className="space-y-6 max-w-md mx-auto">
                    <div className="space-y-2">
                      <Label className="font-bold">Colleague Email</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="manager@brand.com"
                          className="rounded-xl h-12"
                          value={teamEmail}
                          onChange={(e) => setTeamEmail(e.target.value)}
                        />
                        <Button variant="secondary" className="h-12 rounded-xl px-6 font-bold">Add</Button>
                      </div>
                    </div>
                    <div className="space-y-3 pt-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Added Members</p>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
                        <span className="text-sm font-medium">{currentUser?.email} (You)</span>
                        <Badge className="bg-primary">Admin</Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="bg-slate-50/50 border-t p-8 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1 || isSaving || showConfetti}
              className="rounded-xl font-bold h-12 px-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:block">Step {currentStep} of {STEPS.length}</span>
              {currentStep < STEPS.length ? (
                <Button
                  onClick={nextStep}
                  disabled={isSaving}
                  className="rounded-xl font-bold h-12 px-10 shadow-xl shadow-primary/20"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Next Step <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={finishOnboarding}
                  disabled={isSaving || showConfetti}
                  className="rounded-xl font-bold h-12 px-10 bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Finish Setup
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <h2 className="text-2xl font-black text-primary">You're Ready to Launch!</h2>
            <p className="text-slate-500">Redirecting you to your brand workspace...</p>
          </motion.div>
        )}

        <div className="flex justify-center items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-primary" /> SOC2 Compliant</span>
          <span className="text-slate-200">|</span>
          <span className="flex items-center gap-1.5"><Rocket className="h-3 w-3 text-primary" /> Fast Track Active</span>
        </div>
      </div>
    </div>
  );
}
