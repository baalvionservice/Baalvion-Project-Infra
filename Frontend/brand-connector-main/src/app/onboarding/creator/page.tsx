
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  CheckCircle2,
  Instagram,
  Youtube,
  Music2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Video,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CreatorProfile, OnboardingStatus } from '@/types';
import { setAuthCookies } from '@/lib/auth-cookies';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Welcome', icon: Video },
  { id: 2, title: 'Checklist', icon: CheckCircle2 },
  { id: 3, title: 'Socials', icon: Globe },
  { id: 4, title: 'Portfolio', icon: ImageIcon },
  { id: 5, title: 'Payments', icon: CreditCard },
];

export default function CreatorOnboardingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const creatorId = currentUser?.id ? `creator_${currentUser.id}` : null;
  const { data: creator, loading: creatorLoading } = useDoc<CreatorProfile>(
    creatorId ? `creators/${creatorId}` : null
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for forms
  const [payoutType, setPayoutType] = useState<'UPI' | 'BANK'>('UPI');
  const [samples, setSamples] = useState<string[]>([]);

  useEffect(() => {
    if (creator && creator.onboardingStep) {
      setCurrentStep(creator.onboardingStep);
    }
  }, [creator]);

  const updateOnboarding = async (nextStep: number, isFinal = false) => {
    if (!creatorId) return;

    setIsSaving(true);
    try {
      const updateData: Partial<CreatorProfile> = {
        onboardingStep: nextStep,
        onboardingStatus: isFinal ? OnboardingStatus.COMPLETED : OnboardingStatus.IN_PROGRESS,
        updatedAt: new Date().toISOString()
      };

      if (isFinal) {
        updateData.payoutMethod = {
          type: payoutType,
          details: payoutType === 'UPI' ? { id: 'user@upi' } : { account: '1234567890', ifsc: 'BKID0001' }
        };
        updateData.portfolioSamples = samples.length > 0 ? samples : ['https://picsum.photos/seed/sample1/400/400', 'https://picsum.photos/seed/sample2/400/400'];
      }

      await updateDoc(doc(db!, 'creators', creatorId), updateData);

      if (isFinal) {
        // Sync onboarded state to cookies for middleware
        setAuthCookies({ onboarded: true });
        toast({ title: "Welcome Aboard!", description: "Your profile is now live in the marketplace." });
        router.push('/dashboard/creator');
      } else {
        setCurrentStep(nextStep);
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Update failed", description: "Could not save your progress." });
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => updateOnboarding(currentStep + 1);
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));
  const finishOnboarding = () => updateOnboarding(currentStep, true);

  if (authLoading || creatorLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-primary p-2 rounded-xl">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-slate-900">Setting up your profile</h1>
          <p className="text-slate-500 max-w-md">Let's get your store-front ready for brands to discover your talent.</p>
        </div>

        {/* Step Indicators */}
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

        {/* Card Content */}
        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
          <CardContent className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8 text-center"
                >
                  <div className="aspect-video bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center group cursor-pointer">
                    <Video className="h-16 w-16 text-white/20 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 items-start text-left">
                      <h3 className="text-white text-xl font-bold">Welcome to the Elite Circle</h3>
                      <p className="text-white/80 text-sm">Watch this 60s guide to maximize your earnings on Baalvion.</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                        <Rocket className="h-8 w-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">You're one step away from global brands</h2>
                    <p className="text-slate-500 leading-relaxed">
                      Baalvion is designed to automate your career. By completing this setup, you allow our AI
                      to pitch you to the campaigns that matter most to your audience.
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="checklist"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">Profile Completeness</h3>
                    <p className="text-slate-500">A complete profile gets 4x more campaign invitations.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'High-quality Avatar', checked: !!creator?.photoURL },
                      { label: 'Compelling Bio', checked: (creator?.bio?.length || 0) > 20 },
                      { label: 'Selected Niches', checked: (creator?.niches?.length || 0) > 0 },
                      { label: 'Verified Platforms', checked: true },
                      { label: 'Base Rates Set', checked: Object.keys(creator?.baseRates || {}).length > 0 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-700">{item.label}</span>
                        {item.checked ? (
                          <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Complete</Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-500 border-orange-200">Missing</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="socials"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">Connect your Reach</h3>
                    <p className="text-slate-500">Connect at least one account to verify your engagement metrics.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'ig', name: 'Instagram', icon: Instagram, connected: true, color: 'text-pink-600' },
                      { id: 'yt', name: 'YouTube', icon: Youtube, connected: false, color: 'text-red-600' },
                      { id: 'tt', name: 'TikTok', icon: Music2, connected: false, color: 'text-slate-900' },
                    ].map((plat) => (
                      <div key={plat.id} className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
                            <plat.icon className={cn("h-6 w-6", plat.color)} />
                          </div>
                          <div>
                            <p className="font-black">{plat.name}</p>
                            <p className="text-xs text-slate-400">{plat.connected ? 'Account Sync Active' : 'Not Connected'}</p>
                          </div>
                        </div>
                        <Button variant={plat.connected ? "secondary" : "outline"} className="rounded-xl font-bold px-6">
                          {plat.connected ? 'Verified' : 'Connect'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">Showcase your Work</h3>
                    <p className="text-slate-500">Upload 2 samples of your best content deliverables.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 group hover:border-primary transition-colors cursor-pointer relative overflow-hidden">
                        {samples[i - 1] ? (
                          <img src={samples[i - 1]} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-4">
                              <Plus className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary">Upload Sample</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="bg-primary/5 rounded-2xl p-4 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-xs text-slate-600">Brands use these samples to judge your aesthetic fit for their campaigns.</p>
                  </div>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">Secure Payouts</h3>
                    <p className="text-slate-500">Where should we send your campaign earnings?</p>
                  </div>

                  <div className="space-y-6">
                    <RadioGroup defaultValue={payoutType} onValueChange={(v) => setPayoutType(v as any)} className="grid grid-cols-2 gap-4">
                      <div>
                        <RadioGroupItem value="UPI" id="upi" className="peer sr-only" />
                        <Label htmlFor="upi" className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-100 bg-white p-6 hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                          <Zap className="mb-2 h-6 w-6 text-indigo-600" />
                          <span className="font-bold">UPI</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="BANK" id="bank" className="peer sr-only" />
                        <Label htmlFor="bank" className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-100 bg-white p-6 hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                          <CreditCard className="mb-2 h-6 w-6 text-emerald-600" />
                          <span className="font-bold">Bank A/C</span>
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="space-y-4">
                      {payoutType === 'UPI' ? (
                        <div className="space-y-2">
                          <Label className="font-bold">UPI ID</Label>
                          <Input placeholder="yourname@bank" className="rounded-xl h-12" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold">Account Number</Label>
                            <Input placeholder="0000 0000 0000" className="rounded-xl h-12" />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold">IFSC Code</Label>
                            <Input placeholder="BANK000123" className="rounded-xl h-12 uppercase" />
                          </div>
                        </div>
                      )}
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
              disabled={currentStep === 1 || isSaving}
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
                  disabled={isSaving}
                  className="rounded-xl font-bold h-12 px-10 bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Complete Setup
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Footer info */}
        <div className="flex justify-center items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-primary" /> Encrypted Data</span>
          <span className="text-slate-200">|</span>
          <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-primary" /> Marketplace Ready</span>
        </div>
      </div>
    </div>
  );
}
