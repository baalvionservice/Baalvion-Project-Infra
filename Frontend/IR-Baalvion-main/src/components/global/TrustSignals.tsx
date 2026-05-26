"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Banknote, Scale, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TrustSignals() {
  const signals = [
    { name: "Goldman Sachs", category: "Banking Partner", icon: <Banknote className="h-8 w-8 text-primary" />, description: "Primary investment and operational banking services." },
    { name: "Deloitte", category: "Auditor", icon: <ShieldCheck className="h-8 w-8 text-primary" />, description: "Independent financial audits and controls assurance." },
    { name: "Skadden, Arps", category: "Legal Counsel", icon: <Scale className="h-8 w-8 text-primary" />, description: "Corporate, M&A, and securities legal counsel." },
    { name: "McKinsey & Co.", category: "Strategic Advisor", icon: <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>, description: "Advisory on market strategy and operational excellence." },
  ];

  return (
    <section id="trust" className="w-full bg-white border-y-neutral-500">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black">
            Institutional-Grade Partners
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Our operations are supported by a network of world-class financial, legal, and strategic partners, ensuring the highest standards of governance and execution.
          </p>
        </div>
        <TooltipProvider>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {signals.map((signal) => (
                 <Tooltip key={signal.name}>
                    <TooltipTrigger asChild>
                        <Card className="bg-white border-neutral-200 text-black text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                            {signal.icon}
                            <div className="flex-grow">
                            <p className="text-lg font-bold">{signal.name}</p>
                            <p className="text-sm text-gray-600">{signal.category}</p>
                            </div>
                        </CardContent>
                        </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{signal.description}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
            </div>
        </TooltipProvider>
      </div>
    </section>
  );
}
