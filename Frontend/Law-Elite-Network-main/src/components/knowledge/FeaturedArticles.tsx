
"use client";

import React from 'react';
import Link from 'next/link';
import { Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FeaturedArticlesProps {
  articles: any[];
}

export function FeaturedArticles({ articles }: FeaturedArticlesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {articles.map((art) => (
        <Link key={art.id} href={`/article/${art.slug}`} className="group">
          <div className="relative p-10 rounded-[3rem] border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all duration-700 h-full group">
            <div className="absolute top-0 right-0 p-8">
               <Award className="w-12 h-12 text-blue-50 group-hover:text-blue-100 group-hover:scale-110 transition-all duration-700" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Expert-Verified Strategic Guide</span>
              </div>

              <h3 className="text-3xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight max-w-sm">
                {art.title}
              </h3>

              <p className="text-base text-slate-500 font-medium italic leading-relaxed max-w-md">
                {art.summary}
              </p>

              <div className="pt-4">
                <button className="bg-slate-900 text-white group-hover:bg-blue-600 px-8 h-12 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-200 group-hover:shadow-blue-200 transition-all duration-500">
                  Read Analysis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
