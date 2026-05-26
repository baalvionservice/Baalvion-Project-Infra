"use client";

import React from 'react';
import { 
  Briefcase, 
  Search, 
  FileText, 
  ShieldCheck, 
  Award, 
  Zap, 
  ArrowRight,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CreateCaseModal from '@/components/case/CreateCaseModal';

interface EmptyDashboardProps {
  userId: string;
  onRefresh: () => void;
}

/**
 * @fileOverview EmptyDashboard
 * A high-fidelity, guided onboarding experience for new platform members.
 * Optimized for high-trust Bank-Grade UI.
 */
export default function EmptyDashboard({ userId, onRefresh }: EmptyDashboardProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Hero Section */}
      <section className="bg-white p-10 rounded-2xl border border-slate-200 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em]">
              Initialization Protocol
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Welcome to the <br /> <span className="text-blue-600">Law Elite Network</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium mb-8 leading-relaxed">
            Your legal command center is ready. Establish your presence by creating your first legal brief or connecting with a verified practitioner.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <CreateCaseModal userId={userId} onSuccess={onRefresh} />
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-lg px-8 h-12 font-bold text-xs uppercase tracking-widest" asChild>
              <Link href="/lawyers">Find Elite Counsel</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Action Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard 
          icon={<PlusCircle className="w-8 h-8 text-blue-600" />}
          title="Create First Brief"
          description="Submit your legal matter to the network for elite practitioner discovery."
          cta={<CreateCaseModal userId={userId} onSuccess={onRefresh} />}
        />
        <ActionCard 
          icon={<Search className="w-8 h-8 text-blue-600" />}
          title="Consultation Hub"
          description="Identify and secure executive sessions with top-ranked domain experts."
          cta={
            <Button variant="link" className="text-blue-600 p-0 font-bold uppercase text-[10px] tracking-widest h-auto group" asChild>
              <Link href="/lawyers">Explore Discovery <ChevronRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-all" /></Link>
            </Button>
          }
        />
        <ActionCard 
          icon={<FileText className="w-8 h-8 text-blue-600" />}
          title="Secure Vault"
          description="Establish your E2E encrypted dossier for sensitive document management."
          cta={
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Module Ready
            </span>
          }
        />
      </section>

      {/* Trust & Motivation Section */}
      <section className="py-12 border-t border-slate-100 text-center space-y-8">
        <h3 className="text-2xl font-bold text-slate-900">The Benchmark of Platform Integrity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-80">
          <TrustPoint 
            icon={<Award className="w-5 h-5 text-blue-600" />}
            title="Vetted Counsel"
            desc="Top 1% of Global Practitioners"
          />
          <TrustPoint 
            icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
            title="E2E Security"
            desc="AES-256 Encrypted Channels"
          />
          <TrustPoint 
            icon={<Zap className="w-5 h-5 text-blue-600" />}
            title="AI Intelligence"
            desc="Precision Matching Protocols"
          />
        </div>
      </section>

    </div>
  );
}

function ActionCard({ icon, title, description, cta }: { icon: React.ReactNode, title: string, description: string, cta: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 executive-card group flex flex-col items-center text-center space-y-4">
      <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all border border-slate-100">
        {icon}
      </div>
      <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{description}</p>
      <div className="mt-auto pt-2">
        {cta}
      </div>
    </div>
  );
}

function TrustPoint({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon}
        <h5 className="text-xs font-bold uppercase tracking-widest text-slate-900">{title}</h5>
      </div>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{desc}</p>
    </div>
  );
}
