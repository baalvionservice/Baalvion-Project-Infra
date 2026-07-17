"use client"

import { use, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { NexusBadge } from "@/components/ui/nexus-card"
import { Composer } from "@/components/forums/composer"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getThread, createReply, type ForumThread, type ForumPost } from "@/lib/api/community"

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const communitySlug = searchParams.get("c") ?? "";
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!communitySlug) { setNotFoundState(true); setLoading(false); return; }
    let cancelled = false;
    getThread(communitySlug, resolvedParams.id).then((result) => {
      if (cancelled) return;
      if (!result) { setNotFoundState(true); } else { setThread(result.thread); setPosts(result.posts); }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [communitySlug, resolvedParams.id]);

  if (notFoundState) {
    notFound();
  }

  if (loading || !thread) {
    return <div className="container mx-auto px-6 pt-44 pb-32 text-gray-500 font-medium">Loading discussion…</div>;
  }

  return (
    <div className="pb-32">
      <section className="relative pt-44 pb-12 overflow-hidden border-b border-white/5">
        <div className="container mx-auto px-6">
          <Link href={`/forum/${communitySlug}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-cyan-400 transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Discussions
          </Link>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <NexusBadge className="bg-cyan-500/10 text-cyan-400 border-none">{communitySlug}</NexusBadge>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                Posted {new Date(thread.timestamp).toLocaleDateString()}
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight max-w-5xl">
              {thread.title}
            </h1>

            <div className="flex items-center gap-4 pt-6">
              <div className="font-bold flex items-center gap-2">
                {thread.user?.username ?? "member"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-12">
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-l-4 border-cyan-500 pl-4">{posts.length} Responses</h3>
              {posts.map((post) => (
                <div key={post.pid} className="flex flex-col md:flex-row gap-8 p-8 rounded-3xl border border-white/5 bg-white/[0.01]">
                  <aside className="w-full md:w-48 shrink-0">
                    <div className="font-bold text-sm">{post.user?.username ?? "member"}</div>
                  </aside>
                  <div className="flex-1 space-y-4">
                    <div className="text-gray-400 leading-relaxed">{post.content}</div>
                    <div className="text-[9px] font-bold text-gray-700 uppercase">{new Date(post.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            <Composer
              submitLabel="Post Reply"
              onSubmit={(content) => createReply(communitySlug, resolvedParams.id, content).then(() => {})}
              onSuccess={() => {
                getThread(communitySlug, resolvedParams.id).then((result) => { if (result) setPosts(result.posts); });
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
