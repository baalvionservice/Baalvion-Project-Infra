"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, Star, Gavel, UserCheck } from 'lucide-react';
import { StoryCard } from '@/components/knowledge/news/StoryCard';
import { articleUrl } from '@/lib/article-url';

export function TabbedStoryBox({
  popular,
  exclusives,
  legal,
  profiles,
}: {
  popular: any[];
  exclusives: any[];
  legal: any[];
  profiles: any[];
}) {
  const [activeTab, setActiveTab] = useState<'popular' | 'exclusives' | 'legal' | 'profiles'>('popular');

  const tabs = [
    { id: 'popular', label: 'MOST READ', icon: Flame, items: popular },
    { id: 'exclusives', label: 'PAGE SIX EXCLUSIVES', icon: Star, items: exclusives },
    { id: 'legal', label: 'LEGAL SCOOP', icon: Gavel, items: legal },
    { id: 'profiles', label: 'FEATURED PROFILES', icon: UserCheck, items: profiles },
  ] as const;

  const currentItems = tabs.find((t) => t.id === activeTab)?.items || [];

  return (
    <div className="bg-white border-2 border-slate-900 rounded-sm shadow-md my-8">
      {/* Tabs Header */}
      <div className="flex border-b-2 border-slate-900 overflow-x-auto no-scrollbar bg-slate-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text.5 text-[12px] font-black uppercase tracking-wider whitespace-nowrap transition-colors border-r border-slate-300 last:border-r-0 ${
                isActive
                  ? 'bg-[#E13131] text-white shadow-inner'
                  : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {currentItems.length === 0 ? (
          <p className="text-slate-500 text-center py-8 font-serif">No stories available in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentItems.slice(0, 4).map((article) => (
              <StoryCard key={article.slug || article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
