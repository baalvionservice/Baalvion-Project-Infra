'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ShortItem {
  id: string;
  title: string;
  personName: string;
  views: string;
  duration: string;
  thumbnail: string;
  category: string;
  verifiedBadge?: boolean;
}

const SHORTS_DATA: ShortItem[] = [
  {
    id: 'short-1',
    title: 'Inside the Supreme Court Chamber: Key Oral Argument Moments',
    personName: 'Law Elite Court Cam',
    views: '1.2M',
    duration: '0:58',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    category: 'SCOTUS Live',
    verifiedBadge: true,
  },
  {
    id: 'short-2',
    title: 'Law Elite Spotted: Defense Counsel Reacts to Surprise Evidence Ruling',
    personName: 'Law Elite Legal Desk',
    views: '840K',
    duration: '0:42',
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    category: 'Law Elite Exclusive',
    verifiedBadge: true,
  },
  {
    id: 'short-3',
    title: 'Delaware Chancery $54B Decision Breakdown in 60 Seconds',
    personName: 'Corporate Law Insider',
    views: '620K',
    duration: '1:00',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    category: 'Chancery Breakdown',
    verifiedBadge: true,
  },
  {
    id: 'short-4',
    title: 'High-Profile Master Copyright Battle: What Attorneys Say',
    personName: 'Entertainment Desk',
    views: '950K',
    duration: '0:45',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    category: 'Music & Law',
    verifiedBadge: true,
  },
];

export function ShortsReelCarousel() {
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  return (
    <section className="py-8 my-6 bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-sm">
            ▶
          </span>
          <div>
            <div className="flex items-center gap-2 text-xs text-red-500 font-black uppercase tracking-widest">
              <span>LAW ELITE REELS</span>
              <span>•</span>
              <span className="text-slate-400 font-normal">VERTICAL VIDEO SHORTS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
              Courthouse Camera Shorts
            </h2>
          </div>
        </div>

        <span className="text-xs bg-red-600/20 text-red-400 font-mono font-bold px-3 py-1 rounded-full border border-red-500/30">
          🔥 TRENDING SHORTS
        </span>
      </div>

      {/* Grid Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SHORTS_DATA.map((short) => {
          const isPlaying = activePlayingId === short.id;
          return (
            <div
              key={short.id}
              onClick={() => setActivePlayingId(isPlaying ? null : short.id)}
              className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-red-500/80 transition cursor-pointer shadow-lg flex flex-col justify-between h-[360px]"
            >
              {/* Thumbnail Background */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={short.thumbnail}
                  alt={short.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition duration-500 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              </div>

              {/* Top Tag & Duration */}
              <div className="relative z-10 p-3 flex justify-between items-start">
                <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow">
                  {short.category}
                </span>
                <span className="bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 rounded backdrop-blur">
                  {short.duration}
                </span>
              </div>

              {/* Play Icon overlay */}
              <div className="relative z-10 flex items-center justify-center my-auto">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                  isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-black/60 text-white group-hover:bg-red-600 group-hover:scale-110'
                }`}>
                  {isPlaying ? '⏸' : '▶'}
                </div>
              </div>

              {/* Bottom Details */}
              <div className="relative z-10 p-4 space-y-1.5 bg-gradient-to-t from-slate-950 to-transparent pt-6">
                <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                  <span>{short.personName}</span>
                  {short.verifiedBadge && <span className="text-blue-400">✓</span>}
                  <span className="mx-1">•</span>
                  <span className="text-slate-400">{short.views} views</span>
                </div>
                <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-red-400 transition">
                  {short.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
