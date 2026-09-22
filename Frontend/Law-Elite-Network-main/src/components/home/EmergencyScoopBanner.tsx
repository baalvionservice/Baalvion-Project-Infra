'use client';

import React, { useState } from 'react';

interface LiveUpdate {
  time: string;
  headline: string;
  summary: string;
  source: string;
  urgent?: boolean;
}

const LIVE_SCOOPS: LiveUpdate[] = [
  {
    time: 'JUST NOW',
    headline: 'Supreme Court Issues Emergency Stay on High-Profile Corporate Governance Order',
    summary: 'The Justices granted an emergency application staying the lower court injunction pending full appellate briefing.',
    source: 'SCOTUS Docket Dispatch',
    urgent: true,
  },
  {
    time: '12 MINS AGO',
    headline: 'Delaware Chancery Court Denies Motion to Dismiss $54B Shareholder Suit',
    summary: 'Chancellor McCullough ruled that breach of fiduciary duty allegations pass the motion to dismiss threshold.',
    source: 'Delaware Chancery Press',
    urgent: false,
  },
  {
    time: '45 MINS AGO',
    headline: 'Law Elite Exclusive: Top Trial Attorney Spotted at Federal Courthouse in Manhattan',
    summary: 'Defense counsel entered through side ramp amid speculation of impending grand jury indictment announcement.',
    source: 'Law Elite Legal Desk',
    urgent: false,
  },
];

export function EmergencyScoopBanner() {
  const [expanded, setExpanded] = useState(false);
  const [audioActive, setAudioActive] = useState(false);

  return (
    <div className="bg-red-700 text-white border-b-2 border-red-900 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Flashing Badge & Main Headline */}
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto sm:flex-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black text-white text-xs font-black tracking-widest uppercase animate-pulse shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              BREAKING SCOOP
            </span>
            <p className="text-sm sm:text-base font-bold truncate">
              {LIVE_SCOOPS[0].headline}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
            <button
              onClick={() => setAudioActive(!audioActive)}
              className={`text-xs px-2.5 py-1 rounded border font-medium transition flex items-center gap-1 ${
                audioActive ? 'bg-white text-red-700 border-white font-bold' : 'border-red-400 hover:bg-red-800'
              }`}
              title="Toggle Live Audio Alert Chime"
            >
              {audioActive ? '🔊 Audio Alerts ON' : '🔇 Mute Alerts'}
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-auto sm:ml-0 text-xs px-3 py-1.5 sm:py-1 bg-black hover:bg-slate-900 font-bold uppercase tracking-wider rounded text-white transition flex items-center gap-1"
            >
              <span>{expanded ? 'Close Live Wire ▲' : 'Live Wire (3 Updates) ▼'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Live Wire Log Drawer */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-red-600/60 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
            {LIVE_SCOOPS.map((scoop, idx) => (
              <div key={idx} className="bg-red-800/80 p-3 rounded border border-red-600/50 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] text-red-200 font-mono">
                  <span>{scoop.time}</span>
                  <span className="font-semibold text-white uppercase">{scoop.source}</span>
                </div>
                <h4 className="font-bold text-white text-sm leading-snug">{scoop.headline}</h4>
                <p className="text-red-100 line-clamp-2">{scoop.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
