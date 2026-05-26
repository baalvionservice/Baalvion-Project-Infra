
"use client"

import { Card } from "@/components/ui/card";
import { CheckCircle2, FileText, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmissionProgressProps {
  stage: string;
  email: string;
}

export function SubmissionProgress({ stage, email }: SubmissionProgressProps) {
  return (
    <Card className="max-w-2xl w-full border-none shadow-2xl p-12 text-center space-y-8 bg-white rounded-[2.5rem]">
      <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tighter uppercase italic">Strategy Dispatched</h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Mapped to <span className="text-primary font-bold">{stage}</span>. Personalized plan sent to <span className="text-primary font-bold">{email}</span>.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
          <FileText className="h-6 w-6 text-primary mx-auto" />
          <p className="text-xs font-bold uppercase text-slate-400">PDF Strategy</p>
          <p className="text-sm font-bold">Generated</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
          <Mail className="h-6 w-6 text-primary mx-auto" />
          <p className="text-xs font-bold uppercase text-slate-400">Email Delivery</p>
          <p className="text-sm font-bold text-emerald-600">Sent</p>
        </div>
      </div>
      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4 text-left">
        <div className="p-2 bg-white rounded-xl shadow-sm"><AlertCircle className="h-6 w-6 text-primary" /></div>
        <div>
          <p className="text-sm font-bold text-slate-900">Next Step: Activation</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">Check email to download plan and book your Tier 3 consultation.</p>
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
  );
}
