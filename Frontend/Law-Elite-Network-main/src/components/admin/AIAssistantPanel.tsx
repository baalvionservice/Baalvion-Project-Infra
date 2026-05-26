"use client";

import React from "react";
import { Sparkles, Target, AlertCircle, TrendingUp, Zap, ChevronRight, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * @fileOverview AIAssistantPanel
 * Intelligence persistent sidebar for operational guidance.
 */
export default function AIAssistantPanel() {
  const signals = [
    { id: 1, type: "Anomaly", msg: "Lawyer HS-22 showing 40% decline in engagement velocity.", action: "Audit Profile" },
    { id: 2, type: "Predictive", msg: "Expected 12% lift in Corporate Law briefs next 48h.", action: "Boost Leads" },
    { id: 3, type: "Risk", msg: "Member JE-99 detected with 85% confidence fraud signature.", action: "Lock Account" },
  ];

  return (
    <div className="h-full flex flex-col">
      <header className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">AI Operational Assistant</h3>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5 animate-pulse">Intelligence Active</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8">
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Intelligence Briefing
            </h4>
            <div className="space-y-3">
              {signals.map((s) => (
                <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.type === 'Risk' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {s.type} Signal
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium italic mb-3 leading-relaxed">
                    "{s.msg}"
                  </p>
                  <Button variant="link" className="p-0 h-auto text-[9px] font-bold uppercase tracking-widest text-blue-600 group-hover:underline">
                    {s.action} <ChevronRight className="w-2.5 h-2.5 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" /> Strategic Suggestion
            </h4>
            <p className="text-xs text-slate-400 italic mb-4 leading-relaxed">
              "Based on current dispute resolutions, client trust is trending up. Recommendation: Enable 'Auto-Verification' for practitioners with &gt;4.8 ratings."
            </p>
            <Button className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[9px] tracking-widest">
              Accept Protocol
            </Button>
          </section>
        </div>
      </ScrollArea>

      <footer className="p-6 mt-auto border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Collaboration</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-[10px] text-slate-500 font-medium">3 other admins active</p>
        </div>
      </footer>
    </div>
  );
}
