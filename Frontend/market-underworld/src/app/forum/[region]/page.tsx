"use client"

import { use, useState, useEffect } from "react"
import { FORUM_THREADS, INTERESTING_TOPICS } from "@/lib/mock-forum-data"
import { REGIONS } from "@/data/mockData"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  MessageSquare, 
  Eye, 
  Search, 
  Pin, 
  Lock, 
  Flame, 
  ChevronRight,
  Filter,
  ArrowLeft,
  Users,
  Hash,
  CheckCircle2,
  Award,
  Crown
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"

export default function RegionForumPage({ params }: { params: Promise<{ region: string }> }) {
  const resolvedParams = use(params);
  const region = REGIONS.find(r => r.id === resolvedParams.region);
  
  if (!region) {
    notFound();
  }

  const regionThreads = FORUM_THREADS.filter(t => t.regionId === region.id || t.regionId === 'global');

  return (
    <div className="pb-32">
      {/* Region Header */}
      <section className="relative pt-44 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-[0.1]" style={{ background: `linear-gradient(135deg, ${region.color}, transparent)` }} />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <Link href="/forum" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-cyan-400 transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="flex items-center gap-8">
              <div className="text-8xl">{region.icon}</div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">{region.name}</h1>
                <p className="text-xl text-gray-400 font-medium max-w-xl">{region.description}</p>
              </div>
            </div>
            
            <div className="flex gap-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{(region.teachers ?? 0) * 42}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{regionThreads.length}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Local Threads</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-12">
            {/* Interesting Topics Section */}
            <section>
              <div className="bg-[#111b26] border border-white/10 rounded-t-lg">
                <div className="px-6 py-3 bg-[#1a2634] border-b border-white/5 rounded-t-lg">
                  <h2 className="text-lg font-bold text-gray-300">Interesting topics</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {INTERESTING_TOPICS.map((topic) => (
                    <div 
                      key={topic.id} 
                      className={cn(
                        "flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors",
                        topic.isHighlighted && "bg-pink-500/[0.03]"
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={topic.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {topic.badges.map((badge, idx) => (
                            <span 
                              key={idx} 
                              className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase flex items-center gap-1",
                                badge.color
                              )}
                            >
                              {badge.icon === 'CheckCircle2' && <CheckCircle2 size={10} />}
                              {badge.icon === 'Award' && <Award size={10} />}
                              {badge.icon === 'Crown' && <Crown size={10} />}
                              {badge.text}
                            </span>
                          ))}
                          <h3 className="text-sm font-bold text-gray-200 hover:text-blue-400 cursor-pointer transition-colors truncate">
                            {topic.title}
                          </h3>
                        </div>
                        {topic.meta && (
                          <p className="text-xs text-gray-500 font-medium truncate">
                            {topic.meta}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                {['All Discussions', 'Education', 'Trade', 'VIP'].map((tab) => (
                  <button key={tab} className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${tab === 'All Discussions' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input className="bg-white/5 border border-white/10 h-12 rounded-xl pl-12 pr-4 text-xs font-bold w-full md:w-64 focus:border-cyan-500/50 outline-none" placeholder="Search region..." />
                </div>
                <NexusButton variant="outline" className="border-white/10 text-gray-500 h-12"><Filter className="w-4 h-4" /></NexusButton>
              </div>
            </div>

            <div className="space-y-4">
              {regionThreads.map((thread) => (
                <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
                  <NexusCard className="p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group cursor-pointer relative mb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          {thread.isPinned && <Pin className="w-3.5 h-3.5 text-blue-400" />}
                          {thread.isVip && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                          {thread.isHot && <Flame className="w-3.5 h-3.5 text-red-500" />}
                          <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight">
                            {thread.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <span className="text-cyan-500/80">{thread.category}</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span>{thread.author.name}</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span>{new Date(thread.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 border-l border-white/5 pl-8">
                        <div className="text-center w-16">
                          <div className="text-xl font-bold">{thread.replies}</div>
                          <div className="text-[9px] font-bold text-gray-600 uppercase">Replies</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-cyan-400 transition-all group-hover:translate-x-1" />
                      </div>
                    </div>
                  </NexusCard>
                </Link>
              ))}
            </div>
          </div>

          <aside className="lg:w-80 shrink-0 space-y-12">
            <Link href="/forum/create-thread" className="block w-full">
              <NexusButton className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 h-14 font-bold text-lg shadow-xl shadow-cyan-500/20">
                Start New Discussion
              </NexusButton>
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}