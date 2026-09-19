import React from 'react';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getAllTopics } from '@/data/topics';
import { topicUrl } from '@/lib/topic-url';

export const revalidate = 86400;

export default function TopicsPage() {
  const topics = getAllTopics();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">Topics</h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">Cross-cutting subjects tagged automatically across every article on the network.</p>
          </header>

          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <Link key={t.slug} href={topicUrl(t.slug)} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-4 py-2 transition-colors">
                <Tag className="w-3.5 h-3.5" /> {t.name}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
