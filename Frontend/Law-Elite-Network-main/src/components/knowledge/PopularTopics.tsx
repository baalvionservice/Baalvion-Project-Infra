"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';

type Topic = { name: string; slug: string };

const FALLBACK_TOPICS: Topic[] = [
  { name: "Enterprise Contracts", slug: "contracts" },
  { name: "Criminal Bail Laws", slug: "bail" },
  { name: "Strategic Divorce", slug: "divorce" },
  { name: "GST Compliance", slug: "tax" },
  { name: "Global Trademarks", slug: "trademark" },
  { name: "Startup Incorporation", slug: "business" },
  { name: "Employment Rights", slug: "labor" }
];

/**
 * @fileOverview PopularTopics
 * Surfaces high-intent topics as tactical discovery pills. Topics are managed in
 * the central CMS (admin-platform console) and read via the same-origin
 * /api/cms/homepage route, falling back to the built-in list if unavailable.
 */
export function PopularTopics() {
  const [topics, setTopics] = useState<Topic[]>(FALLBACK_TOPICS);

  useEffect(() => {
    let active = true;
    fetch('/api/cms/homepage')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const cms = j?.data?.popularTopics;
        if (active && Array.isArray(cms) && cms.length) setTopics(cms);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm px-4">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-blue-600 whitespace-nowrap shrink-0">
          <Tag className="w-3.5 h-3.5" /> Popular topics
        </div>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
          {topics.map((topic) => (
            <Link 
              key={topic.name}
              href={`/search?q=${topic.slug}`}
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-slate-50 border border-slate-100 text-[11px] md:text-xs font-semibold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg transition-all duration-300"
            >
              {topic.name}
            </Link>
          ))}
          <Link 
            href="/legal" 
            className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mt-2 md:mt-0"
          >
            All topics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
