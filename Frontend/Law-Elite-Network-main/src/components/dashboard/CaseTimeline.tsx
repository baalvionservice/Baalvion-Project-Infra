"use client";

import React from 'react';
import { CheckCircle2, Circle, Clock, Briefcase, FileText, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseTimelineProps {
  currentStatus: string;
  compact?: boolean;
}

/**
 * @fileOverview CaseTimeline
 * Visual audit of the matter's professional journey.
 */
export default function CaseTimeline({ currentStatus, compact = false }: CaseTimelineProps) {
  const stages = [
    { 
      id: 'draft', 
      label: 'Briefing Initialized', 
      desc: 'Matter parameters committed to network.',
      icon: <FileText className="w-3.5 h-3.5" />
    },
    { 
      id: 'open', 
      label: 'Counsel Discovery', 
      desc: 'Marketplace intelligence matching active.',
      icon: <Briefcase className="w-3.5 h-3.5" />
    },
    { 
      id: 'active', 
      label: 'Strategic Engagement', 
      desc: 'Active counsel managing the dossier.',
      icon: <Gavel className="w-3.5 h-3.5" />
    },
    { 
      id: 'closed', 
      label: 'Final Resolution', 
      desc: 'Matter successfully archived.',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    }
  ];

  const currentIndex = stages.findIndex(s => s.id === currentStatus);

  return (
    <div className={cn("space-y-6", compact ? "px-2" : "px-4")}>
      {!compact && (
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Strategic Audit Trail
          </h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol v4.2</span>
        </div>
      )}

      <div className="relative pl-8 space-y-10 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
        {stages.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;
          
          return (
            <div key={stage.id} className="relative group">
              <div className={cn(
                "absolute -left-11 top-0 w-8 h-8 rounded-xl border flex items-center justify-center z-10 transition-all duration-500",
                isCompleted ? "bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-100" :
                isActive ? "bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-100 scale-110" :
                "bg-white border-slate-200 text-slate-300"
              )}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stage.icon}
              </div>
              
              <div className={cn(
                "transition-all duration-500",
                isActive ? "translate-x-1" : "opacity-80"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h5 className={cn(
                    "text-xs font-bold uppercase tracking-tight",
                    isActive ? "text-blue-600" : isCompleted ? "text-slate-900" : "text-slate-400"
                  )}>
                    {stage.label}
                  </h5>
                  {isActive && (
                    <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase animate-pulse">
                      Active Phase
                    </span>
                  )}
                </div>
                {!compact && (
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    {stage.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
