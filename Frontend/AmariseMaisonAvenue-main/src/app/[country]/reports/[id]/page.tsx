'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MAISON_REPORTS } from '@/lib/mock-monetization';
import { Button } from '@/components/ui/button';
import { Lock, FileText, Download, ShieldCheck, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ReportPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const report = MAISON_REPORTS.find(r => r.id === id);
  const [isLocked, setIsLocked] = useState(true);

  if (!report) return <div className="py-40 text-center font-headline text-3xl">Report not found.</div>;

  const handleUnlock = () => {
    // Simulate unlocking process
    toast({
      title: "Monetization Simulation",
      description: "In a live environment, this would trigger a payment gateway or VIP verification.",
    });
    setTimeout(() => {
      setIsLocked(false);
      toast({
        title: "Report Unlocked",
        description: "You now have full access to the Maison Intelligence archives.",
      });
    }, 1500);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Editorial Header */}
      <section className="container mx-auto px-12 py-32 max-w-[1600px] border-b border-border">
        <div className="flex flex-col lg:flex-row gap-24 items-end">
          <div className="lg:w-2/3 space-y-10">
            <div className="flex items-center space-x-6 text-secondary">
               <BookOpen className="w-6 h-6" />
               <span className="text-[10px] font-bold uppercase tracking-[0.6em]">Maison Intelligence</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-headline font-bold italic leading-[0.85] tracking-tighter text-gray-900">
              {report.title}
            </h1>
            <div className="flex items-center space-x-12 pt-8">
               <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Written By</span>
                  <span className="text-sm font-bold uppercase">{report.author}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Release Date</span>
                  <span className="text-sm font-bold uppercase">{report.date}</span>
               </div>
            </div>
          </div>
          <div className="lg:w-1/3 flex justify-end">
             <div className="bg-ivory p-8 border border-border space-y-4 w-full max-w-sm">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold uppercase tracking-widest">Access Status</span>
                   <Badge className={cn("text-[8px] uppercase", isLocked ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                     {isLocked ? 'Premium Locked' : 'Full Access'}
                   </Badge>
                </div>
                <p className="text-[11px] text-gray-500 italic leading-relaxed">This intelligence report is part of the Maison's private curatorial archives.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Preview Content */}
      <section className="container mx-auto px-12 py-24 max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-32">
          <div className="lg:col-span-8 space-y-16">
            <div className="prose prose-2xl font-light leading-relaxed text-gray-700 italic first-letter:text-9xl first-letter:font-headline first-letter:text-black first-letter:float-left first-letter:mr-6 first-letter:mt-4">
              {report.summary}
            </div>

            {isLocked ? (
              <div className="relative py-40 flex flex-col items-center justify-center text-center space-y-12">
                <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none opacity-80" />
                {/* Blurry Content Simulation */}
                <div className="w-full space-y-8 blur-md select-none">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="h-6 bg-gray-100 rounded-full w-full" />
                   ))}
                </div>
                
                <div className="relative z-10 bg-white p-16 shadow-2xl border border-border space-y-10 max-w-2xl">
                   <div className="w-16 h-16 bg-plum/10 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-8 h-8 text-plum" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-4xl font-headline font-bold italic">Exclusive Intelligence</h3>
                      <p className="text-lg text-gray-500 font-light italic">
                        Access the complete 45-page analysis, regional data tables, and future market predictions.
                      </p>
                   </div>
                   <Button 
                    className="w-full h-16 bg-black text-white hover:bg-plum rounded-none text-[11px] font-bold tracking-[0.4em] uppercase"
                    onClick={handleUnlock}
                   >
                     UNLOCK FULL REPORT — $450
                   </Button>
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Complimentary for Maison Privé Members</p>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-12">
                 <div className="p-12 bg-ivory border border-border space-y-8">
                    <div className="flex items-center space-x-4 text-plum">
                       <Download className="w-6 h-6" />
                       <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Archival Download Available</h3>
                    </div>
                    <p className="text-xl font-light italic">Your institutional access allows for a single high-fidelity PDF export of this report.</p>
                    <Button variant="outline" className="border-black h-12 rounded-none text-[10px] font-bold tracking-widest uppercase px-10">DOWNLOAD ISO-CERTIFIED PDF</Button>
                 </div>
                 
                 <div className="prose prose-xl font-light leading-relaxed text-gray-700 whitespace-pre-wrap selection:bg-plum/10">
                    {/* Simulated Full Content */}
                    <h2 className="text-4xl font-headline font-bold italic text-black mb-8">The Shift Toward Archival Resilience</h2>
                    <p>In the prevailing global economic landscape, the definition of luxury has moved beyond aesthetic novelty toward what we term "Archival Resilience." Our data indicates that artifacts with documented provenance from the early 20th century have outperformed traditional equity benchmarks by 14% since Q3 2023.</p>
                    <p>Within the UAE market, we observe a particular surge in high-jewelry liquidity, driven by a new class of collectors who prioritize the "material purity" of the artifact over seasonal trend cycles.</p>
                 </div>
              </div>
            )}
          </div>

          {/* Sidebar Signifiers */}
          <aside className="lg:col-span-4 space-y-12 sticky top-40">
             <div className="bg-black p-12 text-white shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                <h3 className="text-3xl font-headline font-bold italic leading-tight">Private Consultation</h3>
                <p className="text-xs font-light italic opacity-60">Should the findings in this report influence your acquisition strategy, our curators are available for bespoke private dialogue.</p>
                <Button className="w-full h-14 bg-white text-black hover:bg-gold hover:text-black rounded-none text-[10px] font-bold tracking-[0.4em] uppercase">
                  SPEAK WITH A CURATOR
                </Button>
             </div>

             <div className="p-10 border border-border bg-white space-y-8">
                <div className="flex items-center space-x-3 text-secondary">
                   <ShieldCheck className="w-5 h-5" />
                   <h4 className="text-[10px] font-bold uppercase tracking-widest">Trust Registry</h4>
                </div>
                <p className="text-[11px] text-gray-500 italic leading-relaxed">Every report from Maison Amarisé is audited for market accuracy and adheres to our Institutional Responsibility standards.</p>
             </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-1 rounded-sm font-bold tracking-tighter", className)}>
      {children}
    </span>
  );
}
