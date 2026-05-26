
"use client"

import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Globe, Zap, TrendingUp, Truck, Target, ArrowRight } from "lucide-react";
import { PartnershipSurvey } from "@/components/partnership/PartnershipSurvey";
import { SubmissionProgress } from "@/components/partnership/SubmissionProgress";

export default function PartnershipPlanLanding() {
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [calculatedStage, setCalculatedStage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleSurveySubmit = async (data: any) => {
    setIsSubmitting(true);
    setUserEmail(data.email);
    
    const steps = ["Analyzing...", "Mapping...", "Generating...", "Dispatching..."];
    const stageMap: Record<string, string> = {
      "0-50": "Stage 0 – Beginner",
      "50-200": "Stage 1 – Scaling",
      "200-500": "Stage 2 – Expansion",
      "500+": "Stage 3 – Enterprise"
    };
    setCalculatedStage(stageMap[data.volume] || "Stage 0");

    for (let i = 0; i < steps.length; i++) {
      setSubmissionStep(i);
      await new Promise(r => setTimeout(r, 800));
    }

    setIsSubmitting(false);
    setSubmitted(true);
    toast({ title: "Strategy Synchronized", description: "Personalized strategy sent to your inbox." });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <SubmissionProgress stage={calculatedStage} email={userEmail} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <section className="relative py-20 lg:py-32 bg-slate-900 text-white overflow-hidden">
        <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto text-center lg:text-left">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/20 text-secondary rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-secondary/30">
                <Zap className="h-3 w-3" /> Industry Blueprint
              </div>
              <h1 className="text-5xl md:text-7xl font-headline font-black leading-[0.9] uppercase italic tracking-tighter">
                Custom <span className="text-secondary">Mining</span> Partnership Roadmap
              </h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed font-medium">
                Complete our industrial survey to receive a personalized PDF plan covering material selection, logistics strategy, and automated compliance.
              </p>
              <Button onClick={scrollToForm} size="lg" className="bg-secondary text-secondary-foreground h-16 px-10 text-lg font-black uppercase italic rounded-2xl group shadow-2xl">
                Initialize Plan Generator <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { label: "Phase Mapping", val: "Stages", icon: TrendingUp },
                { label: "Data Integrity", icon: ShieldCheck, val: "Tier 3 Roadmap" },
                { label: "Supply Strategy", val: "Corridors", icon: Truck },
                { label: "ROI Analysis", val: "Cost-Saving", icon: Target },
              ].map((box, i) => (
                <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] space-y-4 backdrop-blur-sm">
                  <box.icon className="h-8 w-8 text-secondary" />
                  <div>
                    <p className="text-[9px] font-black text-secondary uppercase tracking-widest">{box.label}</p>
                    <p className="text-xl font-bold">{box.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={formRef} className="py-24 scroll-mt-16 bg-white">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-16 items-start">
            <div className="lg:col-span-2 space-y-8 sticky top-24">
              <h2 className="text-4xl font-headline font-black text-primary uppercase italic tracking-tighter leading-none">Trade Profiling</h2>
              <p className="text-slate-500 font-medium">Automated lead scoring and stage calculation for industrial verification.</p>
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-4">Strategy Components</h3>
                <ul className="space-y-6">
                  {["Stage Analysis", "Grade Matching", "Supply Chain", "Action Plan"].map((s, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-primary font-black text-[10px] shrink-0 mt-1">{i + 1}</div>
                      <div><h4 className="font-bold text-slate-900 text-sm uppercase">{s}</h4></div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Card className="lg:col-span-3 border-none shadow-2xl rounded-[3rem] overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-10">
                <CardTitle className="text-2xl font-black uppercase italic">Business Intake Terminal</CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <PartnershipSurvey 
                  onSubmit={handleSurveySubmit} 
                  isSubmitting={isSubmitting} 
                  submissionStep={submissionStep} 
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
