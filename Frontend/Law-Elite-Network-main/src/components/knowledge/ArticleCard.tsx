"use client";

import React from 'react';
import Link from 'next/link';
import { Eye, Clock, ChevronRight, FileText, ShieldCheck } from 'lucide-react';

interface ArticleCardProps {
  article: any;
}

/**
 * @fileOverview Optimized Article Card
 * Surgically tuned for interactive lift, high visibility, and professional metadata.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/article/${article.slug}`} className="group block h-full">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 h-full flex flex-col relative overflow-hidden group/card">
        {/* Professional Meta Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/card:bg-blue-600 group-hover/card:text-white transition-all duration-500 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover/card:text-blue-600 transition-colors">
              Topic Dossier
            </span>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-500/20 group-hover/card:text-emerald-500 transition-colors duration-500" />
        </div>

        {/* Intelligence Title */}
        <h3 className="text-2xl font-bold text-slate-900 group-hover/card:text-blue-700 transition-colors leading-tight mb-4 font-serif">
          {article.title}
        </h3>
        
        {/* Strategic Summary */}
        <p className="text-sm text-slate-500 leading-relaxed font-medium italic line-clamp-3 mb-10 flex-1">
          "{article.summary}"
        </p>

        {/* Audit Metadata Footer */}
        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-2 group-hover/card:text-blue-600 transition-colors">
              <Eye className="w-3.5 h-3.5" /> {article.views} Professional Audits
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> {article.readingTime}M Session
            </span>
          </div>
          
          <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover/card:bg-blue-50 group-hover/card:text-blue-600 transition-all transform translate-x-2 group-hover/card:translate-x-0 opacity-0 group-hover/card:opacity-100 duration-500 shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Interactive Hover Accent */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500 transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-700 origin-left" />
      </div>
    </Link>
  );
}
