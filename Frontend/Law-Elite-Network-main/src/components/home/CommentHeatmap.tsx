"use client";

import React from 'react';
import Link from 'next/link';
import { MessageSquare, Flame, TrendingUp } from 'lucide-react';

export interface CommentTopic {
  id: string;
  topicName: string;
  commentCount: number;
  trendingRank: number;
  hotness: 'EXTREME' | 'HIGH' | 'MODERATE';
  articleSlug: string;
}

const HEATMAP_TOPICS: CommentTopic[] = [
  {
    id: 'heat-1',
    topicName: 'Supreme Court Presidential Immunity Ruling & Executive Power',
    commentCount: 1842,
    trendingRank: 1,
    hotness: 'EXTREME',
    articleSlug: 'donald-trump-constitutional-immunity-ruling-analysis',
  },
  {
    id: 'heat-2',
    topicName: 'Delaware Court of Chancery Elon Musk Compensation Rescission',
    commentCount: 1215,
    trendingRank: 2,
    hotness: 'HIGH',
    articleSlug: 'elon-musk-delaware-corporate-governance-chancery-court',
  },
  {
    id: 'heat-3',
    topicName: 'Fulton County Georgia RICO Indictment Procedures',
    commentCount: 940,
    trendingRank: 3,
    hotness: 'HIGH',
    articleSlug: 'fani-willis-racketeering-statute-jurisprudence-analysis',
  },
  {
    id: 'heat-4',
    topicName: 'Taylor Swift Master Recording Re-recording Rights & IP Law',
    commentCount: 812,
    trendingRank: 4,
    hotness: 'MODERATE',
    articleSlug: 'taylor-swift-master-recording-ip-rights-analysis',
  },
];

export function CommentHeatmap() {
  return (
    <section className="py-6 bg-slate-950 border border-slate-800 rounded-sm p-6 my-8 text-white">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="bg-[#E13131] text-white p-1.5 rounded-sm">
            <Flame className="w-4 h-4" />
          </span>
          <h2 className="font-serif text-xl font-black uppercase tracking-tight text-white">
            LIVE COMMUNITY DEBATE &amp; COMMENT HEATMAP
          </h2>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest bg-[#E13131] text-white px-2.5 py-1 rounded-xs animate-pulse">
          LIVE UPDATING
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {HEATMAP_TOPICS.map((topic) => (
          <Link
            key={topic.id}
            href={`/article/${topic.articleSlug}`}
            className="group bg-slate-900 border border-slate-800 hover:border-[#E13131] p-4 rounded-sm transition-all block"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#E13131]">
                RANK #{topic.trendingRank}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-xs">
                <MessageSquare className="w-3 h-3" /> {topic.commentCount.toLocaleString()} COMMENTS
              </span>
            </div>

            <h3 className="font-serif text-sm font-bold text-slate-100 group-hover:text-[#E13131] transition-colors line-clamp-2 leading-snug">
              {topic.topicName}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
