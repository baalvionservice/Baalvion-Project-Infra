"use client"

import { use, useState } from "react"
import { FORUM_THREADS, FORUM_REPLIES } from "@/lib/mock-forum-data"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Heart, 
  MessageSquare, 
  ArrowLeft, 
  MoreVertical, 
  Share2, 
  Bookmark,
  CheckCircle2,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { toast } = useToast();
  const thread = FORUM_THREADS.find(t => t.id === resolvedParams.id);
  
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  if (!thread) {
    notFound();
  }

  const replies = FORUM_REPLIES.filter(r => r.threadId === thread.id);

  const handlePostReply = () => {
    if (!replyText.trim()) return;
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      setReplyText("");
      toast({
        title: "Reply Posted!",
        description: "Your intelligence contribution has been indexed on the node."
      });
    }, 1500);
  };

  return (
    <div className="pb-32">
      {/* Thread Header */}
      <section className="relative pt-44 pb-12 overflow-hidden border-b border-white/5">
        <div className="container mx-auto px-6">
          <Link href={`/forum/${thread.regionId}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-cyan-400 transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Discussions
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
            <NexusCard className="p-10 border-white/5 bg-white/[0.02] relative">
              <div className="prose prose-invert max-w-none text-gray-300 text-lg leading-relaxed font-medium">
                {thread.preview}
              </div>
            </NexusCard>

            {/* Replies */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-l-4 border-cyan-500 pl-4">{replies.length} Responses</h3>
              {replies.map((reply) => (
                <div key={reply.id} className={`flex flex-col md:flex-row gap-8 p-8 rounded-3xl border ${reply.isBestAnswer ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/[0.01]'}`}>
                  <aside className="w-full md:w-48 shrink-0">
                    <div className="flex items-center gap-4">
                      <img src={reply.author.avatar} className="w-12 h-12 rounded-full border border-white/10" alt="" />
                      <div>
                        <div className="font-bold text-sm">{reply.author.name}</div>
                        <div className="text-[9px] text-gray-500 uppercase">{reply.author.role}</div>
                      </div>
                    </div>
                  </aside>
                  <div className="flex-1 space-y-4">
                    <div className="text-gray-400 leading-relaxed">
                      {reply.content}
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                      <button className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 hover:text-white transition-colors">
                        <Heart size={14} /> Helpful ({reply.likes})
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <NexusCard className="p-10 border-cyan-500/20 bg-cyan-500/5">
              <h3 className="text-xl font-bold mb-6">Contribute Intelligence</h3>
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm outline-none focus:border-cyan-500/50 transition-all resize-none"
                placeholder="Write your response..."
              />
              <div className="flex justify-end mt-6">
                <NexusButton 
                  onClick={handlePostReply}
                  isLoading={isPosting}
                  disabled={!replyText.trim()}
                  className="px-10 h-14 nexus-gradient-bg font-bold"
                >
                  Post Reply <ArrowRight className="ml-2 w-4 h-4" />
                </NexusButton>
              </div>
            </NexusCard>
          </div>
        </div>
      </main>
    </div>
  );
}
