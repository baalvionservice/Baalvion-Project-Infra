"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, Gavel } from 'lucide-react';

interface CaseProgressTrackerProps {
  activeCase: any;
}

/**
 * @fileOverview CaseProgressTracker
 * High-fidelity roadmap for matter progression.
 */
export default function CaseProgressTracker({ activeCase }: CaseProgressTrackerProps) {
  if (!activeCase) return null;

  const steps = [
    { id: 'draft', label: 'Briefing', desc: 'Matter parameters set' },
    { id: 'open', label: 'Discovery', desc: 'Practitioner matching' },
    { id: 'active', label: 'Strategy', desc: 'Counsel engagement' },
    { id: 'closed', label: 'Resolution', desc: 'Matter finalized' }
  ];

  const currentStatus = activeCase.status || 'draft';
  const currentIndex = steps.findIndex(s => s.id === currentStatus);
  const progressValue = ((currentIndex + 1) / steps.length) * 100;

  return (
    <Card className="border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Gavel className="w-4 h-4 text-blue-600" /> Matter Progression: {activeCase.title}
          </CardTitle>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {activeCase.category || 'General'} Law
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-10">
          <div className="relative">
            <Progress value={progressValue} className="h-1.5 bg-slate-100" />
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-0">
              {steps.map((step, i) => {
                const isCompleted = i < currentIndex;
                const isActive = i === currentIndex;
                
                return (
                  <div key={step.id} className="flex flex-col items-center group">
                    <div className={`w-5 h-5 rounded-full border-4 border-white flex items-center justify-center transition-all duration-500 shadow-sm relative z-10 ${
                      isCompleted ? "bg-emerald-500" : isActive ? "bg-blue-600 scale-125 shadow-blue-200 shadow-lg" : "bg-slate-200"
                    }`}>
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="absolute top-8 text-center min-w-[100px]">
                      <p className={`text-[10px] font-bold uppercase tracking-tighter ${
                        isActive ? "text-blue-600" : isCompleted ? "text-slate-900" : "text-slate-400"
                      }`}>
                        {step.label}
                      </p>
                      {isActive && (
                        <p className="text-[8px] font-medium text-slate-400 uppercase mt-0.5 animate-pulse">
                          Active Phase
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-[10px] font-bold uppercase text-blue-600 tracking-widest">Target Status</p>
                <p className="text-xs font-semibold text-slate-900">Reach "{steps[currentIndex + 1]?.label || 'Closed'}" milestone</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-4">
              "Strategic progression is algorithmically calculated based on verified milestones and engagement velocity."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
