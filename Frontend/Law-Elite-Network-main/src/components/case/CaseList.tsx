"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Clock, 
  FileText, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface CaseListProps {
  cases: any[];
  title?: string;
}

/**
 * @fileOverview CaseList
 * High-fidelity chronological ledger of legal briefs for Bank-Grade UI.
 * Enhanced with stagger entry animations and tactile hover states.
 */
export default function CaseList({ cases, title = "Active Legal Briefs" }: CaseListProps) {
  if (!cases || cases.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 animate-in fade-in duration-700">
        <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active dossiers located in registry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" /> {title}
        </h3>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{cases.length} Matters Identified</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {cases.map((c, index) => (
          <Link key={c.id || c.caseId} href={`/cases/${c.id || c.caseId}`}>
            <Card 
              className="group hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-none border-slate-100 active:scale-[0.995] animate-in fade-in slide-in-from-left-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {c.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-700 transition-colors">
                          <Clock className="w-3 h-3 text-slate-400" /> 
                          Created {c.createdAt ? formatDistanceToNow(new Date(c.createdAt)) : 'recently'} ago
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-700 transition-colors">
                          <FileText className="w-3 h-3 text-slate-400" /> {c.documents?.length || 0} Records
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <Badge 
                      variant="outline"
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all duration-500 ${
                        c.status === "open" || c.status === "draft"
                          ? "bg-blue-50 text-blue-700 border-blue-100 group-hover:bg-blue-600 group-hover:text-white" 
                          : c.status === "in_progress" || c.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white"
                          : "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-600 group-hover:text-white"
                      }`}
                    >
                      {(c.status || 'pending').replace('_', ' ')}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
