"use client"

import { use, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { NexusBadge } from "@/components/ui/nexus-card"
import { Composer } from "@/components/forums/composer"
import { ArrowLeft, Pencil, Flag, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getThread, createReply, editPost, reportPost, acceptAnswer, type ForumThread, type ForumPost } from "@/lib/api/community"

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const communitySlug = searchParams.get("c") ?? "";
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [editingPid, setEditingPid] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [busyPid, setBusyPid] = useState<string | null>(null);

  const refresh = () => getThread(communitySlug, resolvedParams.id).then((result) => {
    if (result) { setThread(result.thread); setPosts(result.posts); }
  });

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

  const startEdit = (post: ForumPost) => {
    setEditingPid(post.pid);
    setEditContent(post.content);
  };

  const saveEdit = async (pid: string) => {
    if (!editContent.trim()) return;
    setBusyPid(pid);
    try {
      await editPost(communitySlug, resolvedParams.id, pid, editContent.trim());
      setEditingPid(null);
      await refresh();
      toast({ title: "Post updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't save edit", description: err instanceof Error ? err.message : "You may only edit your own posts." });
    } finally {
      setBusyPid(null);
    }
  };

  const handleReport = async (pid: string) => {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason || !reason.trim()) return;
    setBusyPid(pid);
    try {
      await reportPost(communitySlug, resolvedParams.id, pid, reason.trim());
      toast({ title: "Report submitted", description: "A moderator will review this post." });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't submit report", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyPid(null);
    }
  };

  const handleAcceptAnswer = async (pid: string) => {
    setBusyPid(pid);
    try {
      await acceptAnswer(communitySlug, resolvedParams.id, pid);
      await refresh();
      toast({ title: "Marked as accepted answer" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't accept answer", description: err instanceof Error ? err.message : "Only the thread author or a moderator can do this." });
    } finally {
      setBusyPid(null);
    }
  };

  const isQuestion = thread.threadType === "question";

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
              {isQuestion && (
                <NexusBadge className={thread.isAnswered ? "bg-emerald-500/10 text-emerald-400 border-none" : "bg-amber-500/10 text-amber-400 border-none"}>
                  {thread.isAnswered ? "✓ Answered" : "Question"}
                </NexusBadge>
              )}
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
              {posts.map((post) => {
                const isAccepted = thread.acceptedPid != null && String(thread.acceptedPid) === String(post.pid);
                return (
                  <div key={post.pid} className={`flex flex-col md:flex-row gap-8 p-8 rounded-3xl border bg-white/[0.01] ${isAccepted ? "border-emerald-500/40" : "border-white/5"}`}>
                    <aside className="w-full md:w-48 shrink-0">
                      <div className="font-bold text-sm">{post.user?.username ?? "member"}</div>
                      {isAccepted && (
                        <div className="mt-2 text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Accepted Answer
                        </div>
                      )}
                    </aside>
                    <div className="flex-1 space-y-4">
                      {editingPid === post.pid ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-cyan-500/50 resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(post.pid)} disabled={busyPid === post.pid} className="px-4 h-9 rounded-lg bg-cyan-500 text-black text-xs font-bold uppercase disabled:opacity-50">Save</button>
                            <button onClick={() => setEditingPid(null)} className="px-4 h-9 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 leading-relaxed">{post.content}</div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="text-[9px] font-bold text-gray-700 uppercase">{new Date(post.timestamp).toLocaleString()}</div>
                        {editingPid !== post.pid && (
                          <div className="flex items-center gap-3 ml-auto">
                            {isQuestion && !thread.isAnswered && (
                              <button onClick={() => handleAcceptAnswer(post.pid)} disabled={busyPid === post.pid} className="text-[10px] font-bold text-gray-500 hover:text-emerald-400 flex items-center gap-1 uppercase disabled:opacity-50">
                                <CheckCircle2 className="w-3 h-3" /> Accept
                              </button>
                            )}
                            <button onClick={() => startEdit(post)} className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 flex items-center gap-1 uppercase">
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button onClick={() => handleReport(post.pid)} disabled={busyPid === post.pid} className="text-[10px] font-bold text-gray-500 hover:text-red-400 flex items-center gap-1 uppercase disabled:opacity-50">
                              <Flag className="w-3 h-3" /> Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Composer
              submitLabel="Post Reply"
              onSubmit={(content) => createReply(communitySlug, resolvedParams.id, content).then(() => {})}
              onSuccess={refresh}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
