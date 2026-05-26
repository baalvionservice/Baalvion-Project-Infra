"use client";

import React from 'react';
import Link from 'next/link';
import { Eye, Clock, ChevronRight, FileText } from 'lucide-react';

interface TrendingArticlesProps {
  articles: any[];
}

export function TrendingArticles({ articles }: TrendingArticlesProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-10 opacity-30 px-4">
        <p className="text-sm font-bold uppercase tracking-widest">No Intelligence Data Synchronized</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4">
      {articles.map((art, index) => (
        <Link key={art.id} href={`/article/${art.slug}`} className="group h-full">
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                Intelligence #{index + 1}
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug mb-4">
              {art.title}
            </h3>
            
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium italic line-clamp-2 mb-8 flex-1">
              "{art.summary}"
            </p>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /> {art.views} Audits</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {art.readingTime}M Session</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
