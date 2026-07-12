"use client"

import { use, useState, useEffect } from "react"
import { FORUM_THREADS } from "@/lib/mock-forum-data"
import { REGIONS_DATA } from "@/lib/mock-data"
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
  Hash
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { notFound } from "next/navigation"

export default function RegionForumPage({ params }: { params: Promise<{ region: string }> }) {
  const resolvedParams = use(params);
  const region = REGIONS_DATA.find(r => r.id === resolvedParams.region);
  
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
          <Link href="/forums" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-cyan-400 transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Forums
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="flex items-center gap-8">
              <div className="text-8xl">{region.icon}</div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">{region.name}</h1>
                <p className="text-xl text-gray-400 font-medium max-w-xl">{region.description || `The home of ${region.name} discussions on NEXUS.`}</p>
              </div>
            </div>
            
            <div className="flex gap-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{Math.floor(Math.random() * 1000) + 200}</div>
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
          {/* Thread List */}
          <div className="flex-1 space-y-12">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                {['All Discussions', 'Education', 'Teachers', 'VIP'].map((tab) => (
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
                <Link key={thread.id} href={`/forums/thread/${thread.id}`}>
                  <NexusCard className="p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group cursor-pointer relative mb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 flex gap-6">
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

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-12">
            <NexusButton className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 h-14 font-bold text-lg">
              Start New Discussion
            </NexusButton>

            <section>
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-8 px-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Regional Contributors
              </h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/5 overflow-hidden">
                      <img src={`https://picsum.photos/seed/reg-user-${i}/100/100`} alt="user" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">User_{i}00</div>
                      <div className="text-[8px] text-gray-600 font-bold uppercase">{Math.floor(Math.random() * 100) + 10} Posts</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
