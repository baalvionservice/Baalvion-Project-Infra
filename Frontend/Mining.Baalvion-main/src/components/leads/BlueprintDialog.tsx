
"use client"

import { DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Download, Zap, Target, Gem, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Lead } from "@/hooks/use-leads";

interface BlueprintDialogProps {
  lead: Lead;
}

export function BlueprintDialog({ lead }: BlueprintDialogProps) {
  const getStageDetails = (volume: string) => {
    const stageMap: Record<string, any> = {
      "0-50": { stage: "Stage 0", focus: "Quality & Supplier Reliability", grade: "Standard Grade" },
      "50-200": { stage: "Stage 1", focus: "Bulk Pricing & Logistics", grade: "Commercial Grade" },
      "200-500": { stage: "Stage 2", focus: "Contracts & Compliance", grade: "Industrial Grade" },
      "500+": { stage: "Stage 3", focus: "Premium Supply Agreements", grade: "Premium Enterprise Grade" }
    };
    return stageMap[volume] || stageMap["0-50"];
  };

  const details = getStageDetails(lead.volume);

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none">
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-secondary" />
          <div>
            <DialogTitle className="text-xl font-bold">Partnership Blueprint Preview</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">ID: {lead.id} • Dynamic Synthesis Ready</DialogDescription>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 text-xs font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white">
            <Printer className="h-3.5 w-3.5 mr-2" /> Print
          </Button>
          <Button className="h-9 text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 bg-white p-12">
        <div className="max-w-3xl mx-auto space-y-12 text-slate-900">
          <div className="border-b-4 border-primary pb-8 flex justify-between items-end">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Mining.Baalvion.com</p>
              <h1 className="text-3xl font-headline font-black uppercase italic tracking-tighter">Custom Partnership Plan</h1>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs font-bold uppercase">Client: <span className="text-primary">{lead.name}</span></p>
              <p className="text-xs font-bold uppercase">Company: <span className="text-primary">{lead.company}</span></p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4" /> 01. Stage & Pain Points
              </h3>
              <div className="p-6 bg-slate-50 border rounded-2xl space-y-4">
                <Badge className="bg-primary text-white font-bold h-8 px-4 text-sm">{details.stage}</Badge>
                <div className="pt-4 border-t space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Bottlenecks Detected:</p>
                  <ul className="space-y-2">
                    {lead.challenges.map((c, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 capitalize">
                        <div className="h-1.5 w-1.5 rounded-full bg-secondary" /> {c.replace('_', ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Target className="h-4 w-4" /> Priority Focus
              </h3>
              <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl h-full flex flex-col justify-center text-center space-y-2">
                <p className="text-2xl font-black text-primary tracking-tight">{details.focus}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Efficiency Benchmark</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Gem className="h-4 w-4" /> 02. Material Recommendation
            </h3>
            <Card className="border-none bg-slate-50 overflow-hidden">
              <div className="grid md:grid-cols-3">
                <div className="p-8 bg-slate-900 text-white space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Mineral</p>
                  <p className="text-2xl font-black capitalize">{lead.material.replace('_', ' ')}</p>
                </div>
                <div className="col-span-2 p-8 space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Recommended Grade</p>
                  <p className="text-xl font-bold text-primary">{details.grade}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="bg-primary p-10 rounded-[2.5rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <h4 className="text-2xl font-black text-white uppercase tracking-tight italic">Activate Partnership</h4>
              <p className="text-primary-foreground/70 max-w-md mx-auto text-sm leading-relaxed">
                Schedule your free consultation to finalize this roadmap and move to Tier 3 verified trading.
              </p>
            </div>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black h-14 px-12 text-lg rounded-2xl shadow-xl relative z-10">
              Book Consultation <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
