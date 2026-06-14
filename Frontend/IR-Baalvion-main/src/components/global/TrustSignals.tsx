"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Landmark, Scale, ShieldCheck, LineChart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TrustSignals() {
  const signals = [
    { name: "Independent Governance", category: "Board Oversight", icon: <Landmark className="h-8 w-8 text-primary" />, description: "An independent board provides oversight of strategy, risk and management accountability." },
    { name: "Compliance by Design", category: "AML / KYC", icon: <ShieldCheck className="h-8 w-8 text-primary" />, description: "Anti-money-laundering and know-your-customer controls are embedded across our operations." },
    { name: "Transparent Reporting", category: "Investor Disclosure", icon: <LineChart className="h-8 w-8 text-primary" />, description: "Clear, consistent reporting and disclosure to shareholders and the investment community." },
    { name: "Disciplined Capital", category: "Allocation Framework", icon: <Scale className="h-8 w-8 text-primary" />, description: "A disciplined approach to deploying capital toward durable, long-term value creation." },
  ];

  return (
    <section id="trust" className="w-full bg-white border-y-neutral-500">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black">
            Built on Institutional-Grade Standards
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Baalvion operates to the governance, compliance and reporting standards that qualified investors expect — the foundation of how we build and protect long-term value.
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
