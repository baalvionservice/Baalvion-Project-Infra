"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Building2,
  Target,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Globe,
  Instagram,
  Youtube,
  Music2,
  IndianRupee,
  Briefcase,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useDealStore } from "@/store/useDealStore";
import { ONBOARDING_GOALS } from "@/types/onboarding";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OnboardingPage() {
  const router = useRouter();
  const { state, fetchState, saveStep, complete, loading } =
    useOnboardingStore();
  const { createDeal } = useDealStore();

  const [localData, setLocalData] = useState(state);

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    setLocalData(state);
  }, [state]);

  const handleNext = async () => {
    const nextStep = state.currentStep + 1;
    if (nextStep === 6) {
      await handleActivate();
    } else {
      await saveStep(nextStep, localData);
    }
  };

  const handleBack = () => {
    saveStep(state.currentStep - 1, localData);
  };

  const handleActivate = async () => {
    // ACTIVATION: Create the first deal automatically based on onboarding info
    await createDeal({
      companyName: localData.companyName,
      value: parseInt(localData.budgetRange.replace(/[^0-9]/g, "")) || 5000,
      source: "manual",
      stage: "new",
    });

    await complete();
    saveStep(6, localData);
  };

  const progress = (state.currentStep / 6) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl z-10 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Activation Workspace
          </h1>
          <p className="text-slate-500 max-w-sm">
            Setup your brand preferences to unlock personalized AI matches.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Step {state.currentStep} of 6
            </span>
            <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">
              {Math.round(progress)}% Optimized
            </span>
          </div>
          <Progress value={progress} className="h-1.5 bg-white shadow-inner" />
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-md">
          <CardContent className="p-10 md:p-16">
            <AnimatePresence mode="wait">
              {state.currentStep === 1 && <StepWelcome onNext={handleNext} />}
              {state.currentStep === 2 && (
                <StepCompany
                  data={localData}
                  onChange={(d) => setLocalData({ ...localData, ...d })}
                />
              )}
              {state.currentStep === 3 && (
                <StepGoals
                  data={localData}
                  onChange={(d) => setLocalData({ ...localData, ...d })}
                />
              )}
              {state.currentStep === 4 && (
                <StepPreferences
                  data={localData}
                  onChange={(d) => setLocalData({ ...localData, ...d })}
                />
              )}
              {state.currentStep === 5 && <StepActivation data={localData} />}
              {state.currentStep === 6 && <StepSuccess />}
            </AnimatePresence>
          </CardContent>

          {state.currentStep > 1 && state.currentStep < 6 && (
            <CardFooter className="bg-slate-50/50 border-t p-8 flex justify-between">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
                className="rounded-xl font-bold h-12 px-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={loading}
                className="rounded-xl font-black h-12 px-10 shadow-xl shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {state.currentStep === 5 ? "Launch Campaign" : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </Card>

        <div className="flex justify-center items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-primary" /> Multi-sig Escrow
          </span>
          <span className="text-slate-200">|</span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-primary" /> AI Verification
          </span>
        </div>
      </div>
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-8"
    >
      <div className="h-24 w-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto mb-8">
        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
      </div>
      <div className="space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">
          Ready to scale?
        </h2>
        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
          We&apos;re going to set up your profile and launch your first campaign
          in under 2 minutes.
        </p>
      </div>
      <Button
        onClick={onNext}
        className="h-16 px-12 rounded-2xl text-lg font-black shadow-2xl shadow-primary/20 scale-105 hover:scale-110 transition-transform"
      >
        Get Started <ArrowRight className="ml-2 h-6 w-6" />
      </Button>
    </motion.div>
  );
}

function StepCompany({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-slate-900">The Basics</h3>
        <p className="text-slate-500 font-medium">
          Tell us about your organization.
        </p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="font-bold text-slate-700">Company Name</Label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="e.g. Lumina Tech"
              className="h-14 pl-12 rounded-2xl border-none bg-slate-100/50 focus-visible:bg-white transition-all text-lg font-bold"
              value={data.companyName}
              onChange={(e) => onChange({ companyName: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-slate-700">Industry Sector</Label>
          <Select
            value={data.industry}
            onValueChange={(v) => onChange({ industry: v })}
          >
            <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-100/50 text-lg font-bold">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="SaaS" className="font-bold">
                Software / SaaS
              </SelectItem>
              <SelectItem value="Fintech" className="font-bold">
                Finance / Fintech
              </SelectItem>
              <SelectItem value="D2C" className="font-bold">
                Consumer Goods (D2C)
              </SelectItem>
              <SelectItem value="Health" className="font-bold">
                Health & Wellness
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}

function StepGoals({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const toggleGoal = (goalId: string) => {
    const current = data.goals || [];
    const next = current.includes(goalId)
      ? current.filter((g: string) => g !== goalId)
      : [...current, goalId];
    onChange({ goals: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
          Campaign Goals
        </h3>
        <p className="text-slate-500 font-medium">
          What do you want to achieve with creators?
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {ONBOARDING_GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={cn(
              "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left",
              data.goals.includes(goal.id)
                ? "bg-primary/5 border-primary shadow-lg shadow-primary/5"
                : "bg-white border-slate-100 hover:border-slate-200"
            )}
          >
            <div
              className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                data.goals.includes(goal.id)
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200"
              )}
            >
              {data.goals.includes(goal.id) && (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-black text-slate-900">{goal.label}</p>
              <p className="text-xs text-slate-500 font-medium">
                {goal.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function StepPreferences({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-slate-900">
          Talent Preferences
        </h3>
        <p className="text-slate-500 font-medium">
          Define your platform and budget boundaries.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="font-bold text-slate-700">Target Platforms</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: "instagram", icon: Instagram, color: "text-pink-600" },
              { id: "youtube", icon: Youtube, color: "text-red-600" },
              { id: "tiktok", icon: Music2, color: "text-slate-900" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const current = data.preferredPlatforms || [];
                  const next = current.includes(p.id)
                    ? current.filter((id: string) => id !== p.id)
                    : [...current, p.id];
                  onChange({ preferredPlatforms: next });
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl border-2 font-bold transition-all",
                  data.preferredPlatforms.includes(p.id)
                    ? "bg-primary/5 border-primary text-primary"
                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-400"
                )}
              >
                <p.icon
                  className={cn(
                    "h-5 w-5",
                    data.preferredPlatforms.includes(p.id)
                      ? p.color
                      : "text-slate-300"
                  )}
                />
                <span className="capitalize">{p.id}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="font-bold text-slate-700">
            Primary Budget Range
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["₹5,000 - ₹10,000", "₹10,000 - ₹50,000", "₹50,000+"].map(
              (range) => (
                <button
                  key={range}
                  onClick={() => onChange({ budgetRange: range })}
                  className={cn(
                    "p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                    data.budgetRange === range
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  {range}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StepActivation({ data }: { data: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-10"
    >
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
          <Zap className="h-8 w-8 fill-current" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            Review & Launch
          </h3>
          <p className="text-slate-500 font-medium">
            Launching your first campaign activates your profile.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <Target className="h-24 w-24" />
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">
              Campaign Brief
            </p>
            <Badge className="bg-emerald-500 border-none font-black text-[8px]">
              READY
            </Badge>
          </div>
          <h4 className="text-2xl font-black">
            {data.companyName} Pilot Launch
          </h4>
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-500 mb-1">
                Target Niche
              </p>
              <p className="text-sm font-bold text-white">{data.industry}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-500 mb-1">
                Budget Goal
              </p>
              <p className="text-sm font-bold text-emerald-400">
                {data.budgetRange}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4 p-6 rounded-3xl bg-blue-50 border border-blue-100">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Launching this pilot creates a real entry in your CRM. Our AI will
          immediately start sourcing matching creators for your{" "}
          {data.preferredPlatforms.join(" & ")} strategy.
        </p>
      </div>
    </motion.div>
  );
}

function StepSuccess() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8"
    >
      <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto shadow-inner text-emerald-500">
        <CheckCircle2 className="h-14 w-14" />
      </div>
      <div className="space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">
          You&apos;re Live! 🚀
        </h2>
        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
          Your brand profile is activated and your first campaign is being
          indexed by our matching engine.
        </p>
      </div>
      <div className="pt-8">
        <Button
          onClick={() => router.push("/dashboard/brand")}
          className="h-16 px-12 rounded-2xl text-lg font-black shadow-2xl shadow-primary/20 group"
        >
          Enter Workspace
          <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
