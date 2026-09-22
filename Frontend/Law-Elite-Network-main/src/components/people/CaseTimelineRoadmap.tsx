'use client';

import React from 'react';

export interface TimelineMilestone {
  date: string;
  stage: 'Filing' | 'Motions' | 'Discovery' | 'Trial' | 'Verdict' | 'Appeal';
  title: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
  docketRef?: string;
}

const DEFAULT_MILESTONES: TimelineMilestone[] = [
  {
    date: 'JANUARY 2024',
    stage: 'Filing',
    title: 'Initial Complaint Filed in Federal District Court',
    description: 'Plaintiffs filed 142-page class action alleging federal securities law and fiduciary violations.',
    status: 'completed',
    docketRef: 'Doc #1',
  },
  {
    date: 'NOVEMBER 2024',
    stage: 'Motions',
    title: 'Motion to Dismiss Argued Before Presiding Judge',
    description: 'Defense counsel presented oral arguments seeking dismissal under Rule 12(b)(6). Motion denied in part.',
    status: 'completed',
    docketRef: 'Doc #48',
  },
  {
    date: 'MAY 2025',
    stage: 'Discovery',
    title: 'Document & Deposition Discovery Phase Concluded',
    description: 'Over 2.4 million pages of internal corporate emails and board meeting minutes produced under protective order.',
    status: 'completed',
    docketRef: 'Doc #112',
  },
  {
    date: 'SEPTEMBER 2026',
    stage: 'Trial',
    title: 'Jury Selection & Opening Statements Underway',
    description: 'Trial proceedings active in Manhattan Federal Courthouse. Expected duration: 4 weeks.',
    status: 'active',
    docketRef: 'Live Docket',
  },
  {
    date: 'NOVEMBER 2026',
    stage: 'Verdict',
    title: 'Anticipated Jury Verdict & Damage Phase',
    description: 'Jury deliberation scheduled following closing arguments.',
    status: 'upcoming',
  },
];

interface CaseTimelineRoadmapProps {
  personName?: string;
  caseTitle?: string;
  milestones?: TimelineMilestone[];
}

export function CaseTimelineRoadmap({
  personName = 'High-Profile Figure',
  caseTitle = 'Federal Litigation Docket Roadmap',
  milestones = DEFAULT_MILESTONES,
}: CaseTimelineRoadmapProps) {
  return (
    <div className="bg-slate-900 text-white rounded-xl overflow-hidden border border-slate-800 p-6 my-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/40 text-red-500 font-bold flex items-center justify-center text-lg">
            ⏳
          </div>
          <div>
            <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-widest">
              CASE ROADMAP & TIMELINE
            </span>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-white">{caseTitle}</h3>
          </div>
        </div>

        <span className="text-xs bg-red-600 text-white font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
          LIVE TRIAL STAGE
        </span>
      </div>

      {/* Horizontal / Vertical Timeline Stepper */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-800 before:z-0">
        {milestones.map((m, idx) => {
          const isCompleted = m.status === 'completed';
          const isActive = m.status === 'active';

          return (
            <div key={idx} className="relative z-10 flex items-start gap-4 group">
              {/* Status Circle Icon */}
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs shrink-0 transition ${
                  isActive
                    ? 'bg-red-600 border-white text-white shadow-lg shadow-red-600/50 scale-110'
                    : isCompleted
                    ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-700 text-slate-500'
                }`}
              >
                {isCompleted ? '✓' : isActive ? 'NOW' : `${idx + 1}`}
              </div>

              {/* Card Details */}
              <div
                className={`flex-1 p-4 rounded-xl border transition ${
                  isActive
                    ? 'bg-slate-950 border-red-500 shadow-xl'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono mb-1">
                  <span className={`font-bold ${isActive ? 'text-red-400' : 'text-slate-400'}`}>
                    {m.date}
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase font-semibold">
                    STAGE: {m.stage}
                  </span>
                </div>

                <h4 className="font-bold text-sm sm:text-base text-white font-serif">{m.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{m.description}</p>

                {m.docketRef && (
                  <div className="mt-2 text-[10px] text-red-400 font-mono flex items-center gap-1 font-semibold">
                    <span>📎 Reference:</span>
                    <span className="underline hover:text-white cursor-pointer">{m.docketRef}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
