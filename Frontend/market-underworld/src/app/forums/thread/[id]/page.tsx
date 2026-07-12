"use client"

import { use, useState, useEffect } from "react"
import { FORUM_THREADS, FORUM_REPLIES } from "@/lib/mock-forum-data"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Heart, 
  MessageSquare, 
  ArrowLeft, 
  MoreVertical, 
  Share2, 
  Flag, 
  Bookmark,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { notFound } from "next/navigation"

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const thread = FORUM_THREADS.find(t => t.id === resolvedParams.id);
  
  if (!thread) {
    notFound();
  }

  const replies = FORUM_REPLIES.filter(r => r.threadId === thread.id);
  const [liked, setLiked] = useState(false);

  return (
    <div className="pb-32">
      {/* Thread Header */}
      <section className="relative pt-44 pb-12 overflow-hidden border-b border-white/5">
        <div className="container mx-auto px-6">
          <Link href={`/forums/${thread.regionId}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-cyan-400 transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to {thread.regionId.toUpperCase()} Discussions
          </Link>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <NexusBadge className="bg-cyan-500/10 text-cyan-400 border-none">{thread.category}</NexusBadge>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                Posted {new Date(thread.timestamp).toLocaleDateString()}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight max-w-5xl">
              {thread.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-8 pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 p-0.5">
                  <img src={thread.author.avatar} className="w-full h-full rounded-full object-cover" alt={thread.author.name} />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    {thread.author.name} <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-500 uppercase font-bold">{thread.author.role}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{thread.author.region}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <NexusButton 
                  onClick={() => setLiked(!liked)}
                  variant="outline" 
                  className={`border-white/10 h-12 gap-2 ${liked ? 'text-red-500 border-red-500/20' : 'text-gray-500'}`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} /> {thread.likes + (liked ? 1 : 0)}
                </NexusButton>
                <NexusButton variant="outline" className="border-white/10 h-12 text-gray-500"><Bookmark className="w-4 h-4" /></NexusButton>
                <NexusButton variant="outline" className="border-white/10 h-12 text-gray-500"><Share2 className="w-4 h-4" /></NexusButton>
                <NexusButton variant="outline" className="border-white/10 h-12 text-gray-500"><MoreVertical className="w-4 h-4" /></NexusButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-12">
            
            {/* Original Post */}
            <NexusCard className="p-10 border-white/5 bg-white/[0.02] relative">
              <div className="prose prose-invert max-w-none text-gray-300 text-lg leading-relaxed font-medium">
                {thread.preview}
                <br /><br />
                I've been analyzing the recent trends in global arbitrage and how it affects payment structures for elite tutoring. Many students are reporting higher network fees on certain chains, so I wanted to open a discussion on the most efficient way to manage your NEXUS balances.
                <br /><br />
                1. Always use L2 solutions where possible.<br />
                2. Check teacher preference before sending large amounts.<br />
                3. Utilize the internal NEXUS wallet for zero-fee transfers between accounts.
              </div>
              <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex gap-2">
                  {thread.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold px-3 py-1 rounded bg-white/5 text-gray-500 uppercase tracking-wider">#{tag}</span>
                  ))}
                </div>
                <NexusButton variant="ghost" className="text-cyan-400 font-bold uppercase tracking-widest text-[10px] gap-2">
                  <MessageSquare className="w-4 h-4" /> Reply to Post
                </NexusButton>
              </div>
            </NexusCard>

            {/* Replies Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-cyan-400" /> {replies.length} Responses
                </h2>
                <div className="flex gap-4 text-sm font-bold text-gray-500">
                  <button className="text-white">Best</button>
                  <button className="hover:text-white transition-colors">Newest</button>
                  <button className="hover:text-white transition-colors">Oldest</button>
                </div>
              </div>

              {replies.map((reply) => (
                <div key={reply.id} className={`flex flex-col md:flex-row gap-8 p-8 rounded-3xl border ${reply.isBestAnswer ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/[0.01]'}`}>
                  <aside className="w-full md:w-48 shrink-0 flex md:flex-col items-center md:items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                      <img src={reply.author.avatar} alt={reply.author.name} />
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        {reply.author.name}
                        {reply.author.role === 'Teacher' && <span className="w-3 h-3 text-amber-500"><CheckCircle2 className="w-full h-full" /></span>}
                      </div>
                      <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{reply.author.role}</div>
                      <div className="hidden md:block text-[8px] text-gray-600 font-bold uppercase mt-4">
                        {reply.author.postsCount} Posts <br />
                        Joined {reply.author.memberSince}
                      </div>
                    </div>
                  </aside>
                  <div className="flex-1 space-y-6">
                    {reply.isBestAnswer && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected Best Answer
                      </div>
                    )}
                    <div className="text-gray-400 leading-relaxed">
                      {reply.content}
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-[10px] font-bold text-gray-600 hover:text-white transition-colors">
                          <Heart className="w-3.5 h-3.5" /> Helpful ({reply.likes})
                        </button>
                        <button className="flex items-center gap-2 text-[10px] font-bold text-gray-600 hover:text-white transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" /> Quote
                        </button>
                      </div>
                      <div className="text-[9px] font-bold text-gray-700 uppercase">{new Date(reply.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Reply Box */}
            <NexusCard className="p-8 border-cyan-500/20 bg-cyan-500/5 mt-16">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                  <img src="https://picsum.photos/seed/aryan/50/50" alt="me" />
                </div>
                Join the discussion...
              </h3>
              <textarea 
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-white placeholder:text-gray-600 focus:ring-1 focus:ring-cyan-500/50 outline-none min-h-[150px]" 
                placeholder="Write your reply here. Use markdown for code blocks..."
              />
              <div className="flex justify-end mt-6">
                <NexusButton className="bg-gradient-to-r from-cyan-600 to-blue-600 px-10 h-14 font-bold">
                  Post Response <ArrowRight className="w-4 h-4 ml-2" />
                </NexusButton>
              </div>
            </NexusCard>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-12">
            <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6">Thread Stats</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase">Views</span>
                  <span className="text-sm font-bold">{thread.views}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase">Participants</span>
                  <span className="text-sm font-bold">{replies.length + 1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase">Activity</span>
                  <span className="text-sm font-bold text-cyan-400">High</span>
                </div>
              </div>
            </NexusCard>

            <section>
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-8">Related Discussions</h3>
              <div className="space-y-4">
                {FORUM_THREADS.slice(0, 3).map(t => (
                  <Link key={t.id} href={`/forums/thread/${t.id}`}>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer group">
                      <div className="text-xs font-bold text-gray-300 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight mb-2">
                        {t.title}
                      </div>
                      <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{t.replies} Replies</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
