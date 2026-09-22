"use client";

import React, { useState } from 'react';
import { Play, Pause, Volume2, Radio, Sparkles } from 'lucide-react';

export function DailyAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="bg-slate-900 border-2 border-[#E13131] text-white p-4 rounded-sm shadow-lg my-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Audio Info */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-[#E13131] hover:bg-red-700 text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
            aria-label={isPlaying ? 'Pause audio briefing' : 'Play audio briefing'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#E13131] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-xs flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> LAW ELITE AUDIO BRIEFING
              </span>
              <span className="text-[11px] font-bold text-slate-400">2 MIN SCOOP</span>
            </div>
            <h3 className="font-serif text-base font-bold text-white mt-1 leading-snug">
              Today&rsquo;s Headlines: Trump SCOTUS Immunity Docket &amp; Delaware Chancery Ruling
            </h3>
          </div>
        </div>

        {/* Right: Waveform Animation & Volume indicator */}
        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
          <div className="flex items-center gap-1 h-5">
            {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95].map((height, i) => (
              <span
                key={i}
                className={`w-1 bg-[#E13131] rounded-full transition-all duration-300 ${
                  isPlaying ? 'animate-pulse' : 'opacity-40'
                }`}
                style={{ height: isPlaying ? `${height}%` : '30%' }}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <Volume2 className="w-4 h-4 text-[#E13131]" />
            <span>DAILY BRIEF</span>
          </div>
        </div>

      </div>
    </div>
  );
}
