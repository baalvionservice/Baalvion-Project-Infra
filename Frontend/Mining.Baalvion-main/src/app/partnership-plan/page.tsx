
"use client"

import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Globe, Zap, TrendingUp, Truck, Target, ArrowRight, CheckCircle2, Mail, Clock } from "lucide-react";
import { PartnershipSurvey } from "@/components/partnership/PartnershipSurvey";

/** Shape of the data emitted by <PartnershipSurvey>. */
interface SurveyData {
  material: string;
  volume: string;
  challenges: string[];
  name: string;
  company: string;
  email: string;
  phone: string;
  supply_type?: string;
  budget?: string;
}

export default function PartnershipPlanLanding() {
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [calculatedStage, setCalculatedStage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleSurveySubmit = async (data: SurveyData) => {
    setIsSubmitting(true);
    setSubmissionStep(0);
    setUserEmail(data.email);

    const stageMap: Record<string, string> = {
      "0-50": "Stage 0 – Beginner",
      "50-200": "Stage 1 – Scaling",
      "200-500": "Stage 2 – Expansion",
      "500+": "Stage 3 – Enterprise",
    };
    setCalculatedStage(stageMap[data.volume] || "Stage 0");

    // Advance the progress UX while the real request is in flight, then settle
    // completion against the awaited response (no fake fixed-duration loop).
    const advance = (async () => {
      for (let i = 0; i < 3; i++) {
        setSubmissionStep(i);
        await new Promise((r) => setTimeout(r, 500));
      }
    })();

    try {
      const res = await fetch("/api/partnership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "partnership-plan", company_website: "" }),
      });
      await advance;
      setSubmissionStep(3); // "Dispatching..." once the server has responded

      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.success) {
        setSubmitted(true);
        toast({
          title: "Request Received",
          description:
            json.message ?? "Our team will review your profile and follow up shortly.",
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          json?.error ??
          "We could not submit your request. Please try again or email trade@baalvion.com.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description:
          "We could not reach the server. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-none shadow-2xl p-12 text-center space-y-8 bg-white rounded-[2.5rem]">
            <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tighter uppercase italic">Request Received</h1>
              <p className="text-lg text-slate-500 leading-relaxed">
                We&apos;ve mapped your profile to <span className="text-primary font-bold">{calculatedStage}</span>. Our partnership team will review your requirements and reach out to <span className="text-primary font-bold">{userEmail}</span> to build your tailored roadmap.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                <Clock className="h-6 w-6 text-primary mx-auto" />
                <p className="text-xs font-bold uppercase text-slate-400">Next Step</p>
                <p className="text-sm font-bold">Team Review</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                <Mail className="h-6 w-6 text-primary mx-auto" />
                <p className="text-xs font-bold uppercase text-slate-400">Follow-up</p>
                <p className="text-sm font-bold">By Email</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild variant="outline" className="h-14 px-8 font-black uppercase text-xs rounded-2xl">
                <a href="/marketplace">Marketplace</a>
              </Button>
              <Button asChild className="bg-primary h-14 px-10 font-black uppercase text-xs rounded-2xl shadow-xl">
                <a href="/dashboard">Command Center</a>
              </Button>
            </div>
          </Card>
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
