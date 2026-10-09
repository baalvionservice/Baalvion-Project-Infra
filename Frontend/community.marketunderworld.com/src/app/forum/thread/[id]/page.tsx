"use client";

import React, { use, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home, ChevronRight, Heart, Quote, Reply, Flag,
  Send, Bold, Italic, Link as LinkIcon, Code, Clock,
  ArrowLeft, Loader2, LogIn, ShieldOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import {
  getCommunity, getThread, createReply, reportPost,
  type ForumThread, type ForumPost,
} from "@/lib/api/community";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Avatar({ username, picture, size = "md" }: { username?: string; picture?: string | null; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-20 h-20 text-2xl" : size === "md" ? "w-16 h-16 text-xl" : "w-9 h-9 text-xs";
  const letter = (username ?? "?")[0].toUpperCase();
  if (picture) return <img src={picture} alt={letter} className={`${dim} rounded-md object-cover`} />;
  return (
    <div className={`${dim} rounded-md flex items-center justify-center font-bold text-white bg-[#c0392b] shadow-lg shrink-0`}>
      {letter}
    </div>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────

function PostCard({
  post, index, communitySlug, tid, onQuote, onReport, canReport,
}: {
  post: ForumPost;
  index: number;
  communitySlug: string;
  tid: string;
  onQuote: (author: string, text: string) => void;
  onReport: (pid: string) => void;
  canReport: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const date = fmtDate(post.timestamp);

  return (
    <div className="rounded-lg border border-[#272736] bg-[#121218] overflow-hidden shadow-xl flex flex-col md:flex-row">
      {/* Author sidebar */}
      <div className="md:w-44 shrink-0 p-4 bg-[#161620] border-b md:border-b-0 md:border-r border-[#242432] flex flex-col items-center text-center gap-2">
        <Avatar username={post.user?.username} picture={post.user?.picture} size={index === 0 ? "lg" : "md"} />
        <div className="text-sm font-bold text-white hover:text-red-400 transition-colors truncate max-w-full">
          {post.user?.username ?? "Unknown"}
        </div>
        <div className="text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider text-red-400 border-red-900/60 bg-red-950/30">
          Member
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232330] text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>{date}</span>
            </div>
            <span className="font-bold text-gray-500">#{index + 1}</span>
          </div>

          <div className="text-sm text-[#d4cfc7] leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-6 pt-4 border-t border-[#232330] flex items-center justify-between flex-wrap gap-2 text-xs">
          <button
            onClick={() => setLiked((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              liked
                ? "bg-red-950/80 text-red-400 border border-red-800"
                : "bg-[#1a1a24] text-gray-400 hover:text-red-400 hover:bg-[#20202c]"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            <span>Like</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuote(post.user?.username ?? "Unknown", post.content.slice(0, 140))}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#1a1a24] hover:bg-[#20202c] text-gray-300 hover:text-white"
            >
              <Quote className="w-3 h-3 text-red-400" /> Quote
            </button>
            {canReport && (
              <button
                onClick={() => onReport(post.pid)}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#1a1a24] hover:bg-[#20202c] text-gray-300 hover:text-red-400"
              >
                <Flag className="w-3 h-3" /> Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const communitySlug = searchParams.get("c") || "";
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [quotedSnippet, setQuotedSnippet] = useState<{ author: string; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const replyBoxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (authLoading || !communitySlug) return;
    (async () => {
      setPageLoading(true);
      const [threadData, community] = await Promise.all([
        getThread(communitySlug, id),
        getCommunity(communitySlug),
      ]);
      if (threadData) {
        setThread(threadData.thread);
        setPosts(threadData.posts);
      }
      const ms = community?.membership;
      setIsApproved(!!ms && (ms.status === "approved" || ms.status === "paid"));
      setPageLoading(false);
    })();
  }, [authLoading, id, communitySlug]);

  const handleQuote = (author: string, text: string) => {
    setQuotedSnippet({ author, text });
    replyBoxRef.current?.scrollIntoView({ behavior: "smooth" });
    replyBoxRef.current?.focus();
    toast({ title: `Quoting @${author}` });
  };

  const handleReport = async (pid: string) => {
    if (!communitySlug || !thread) return;
    try {
      await reportPost(communitySlug, thread.tid, pid, "Inappropriate content");
      toast({ title: "Report submitted", description: "A moderator will review this post." });
    } catch {
      toast({ variant: "destructive", title: "Couldn't submit report" });
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !thread || !communitySlug) return;
    setSubmitting(true);
    try {
      const newPost = await createReply(communitySlug, thread.tid, replyContent.trim());
      // Refresh posts
      const updated = await getThread(communitySlug, thread.tid);
      if (updated) setPosts(updated.posts);
      setReplyContent("");
      setQuotedSnippet(null);
      toast({ title: "Reply published!", description: "Your post has been added." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't post reply", description: err?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const insertFormat = (tag: string) => {
    if (tag === "b")     setReplyContent((p) => p + " **bold** ");
    if (tag === "i")     setReplyContent((p) => p + " *italic* ");
    if (tag === "quote") setReplyContent((p) => p + "\n> Quote snippet\n");
    if (tag === "code")  setReplyContent((p) => p + "\n```\ncode\n```\n");
    if (tag === "link")  setReplyContent((p) => p + " [Link](https://example.com) ");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#06040a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-[#06040a] flex flex-col items-center justify-center text-center px-6">
        <ShieldOff className="w-10 h-10 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Thread not found</h2>
        <p className="text-gray-400 text-sm mb-4">This thread may have been removed or you don't have access.</p>
        <Link href={communitySlug ? `/forum/${communitySlug}` : "/forum"} className="text-red-400 hover:underline text-sm">
          ← Back to forum
        </Link>
      </div>
    );
  }

  const threadDate = fmtDate(thread.timestamp);

  return (
    <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-[#121217] px-4 py-2.5 rounded border border-[#232330] flex-wrap">
          <Link href="/forum" className="hover:text-red-400 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-red-500" /><span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href="/forum" className="hover:text-red-400">Forums</Link>
          {communitySlug && (
            <>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              <Link href={`/forum/${communitySlug}`} className="hover:text-red-400">
                {communitySlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-gray-200 font-semibold truncate max-w-xs">{thread.title}</span>
        </div>

        {/* Thread header */}
        <div className="mb-6 pb-4 border-b border-[#232330]">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">{thread.title}</h1>
          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span>Started by</span>
              <span className="text-red-400 font-semibold">{thread.user?.username ?? "Unknown"}</span>
            </div>
            <span className="opacity-40">·</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>{threadDate}</span>
            </div>
            <span className="opacity-40">·</span>
            <div>Replies: <strong className="text-gray-200">{thread.postcount}</strong></div>
            <span className="opacity-40">·</span>
            <div>Views: <strong className="text-gray-200">{thread.viewcount?.toLocaleString() ?? "—"}</strong></div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4 mb-8">
          {posts.map((post, i) => (
            <PostCard
              key={post.pid}
              post={post}
              index={i}
              communitySlug={communitySlug}
              tid={thread.tid}
              onQuote={handleQuote}
              onReport={handleReport}
              canReport={isAuthenticated}
            />
          ))}
          {posts.length === 0 && (
            <div className="rounded-lg border border-[#272736] bg-[#121218] p-12 text-center text-gray-400">
              <p className="text-sm">No posts yet in this thread.</p>
            </div>
          )}
        </div>

        {/* ── Reply Box ─────────────────────────────────────────────────────── */}
        {!isAuthenticated ? (
          <div className="rounded-lg border border-[#2b2b3b] bg-[#121218] p-8 text-center">
            <LogIn className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">You must be a member to reply in this community.</p>
            <Link
              href={`/auth/signin?next=/forum/thread/${id}?c=${communitySlug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c0392b] hover:bg-[#d63031] text-white font-bold rounded-lg text-sm transition-colors"
            >
              <LogIn className="w-4 h-4" /> Sign In to Reply
            </Link>
          </div>
        ) : !isApproved ? (
          <div className="rounded-lg border border-[#2b2b3b] bg-[#121218] p-8 text-center">
            <ShieldOff className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">You must be an approved member of this community to reply.</p>
            {communitySlug && (
              <Link href={`/forum/${communitySlug}`} className="mt-3 inline-block text-sm text-red-400 hover:underline font-semibold">
                Request membership →
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-[#2b2b3b] bg-[#121218] p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold text-white">
              <Reply className="w-4 h-4 text-red-500" />
              <span>Fast Reply</span>
            </div>

            {quotedSnippet && (
              <div className="mb-3 p-3 rounded bg-[#1a1a26] border-l-4 border-red-500 flex items-center justify-between text-xs text-gray-300">
                <div>
                  <span className="font-bold text-red-400">Replying to {quotedSnippet.author}: </span>
                  "{quotedSnippet.text}…"
                </div>
                <button onClick={() => setQuotedSnippet(null)} className="text-gray-400 hover:text-white ml-2">✕</button>
              </div>
            )}

            <form onSubmit={handlePostReply}>
              {/* Toolbar */}
              <div className="flex items-center gap-1 bg-[#1a1a26] border border-[#2b2b3a] border-b-0 rounded-t px-3 py-1.5">
                {[
                  { tag: "b",     icon: <Bold className="w-3.5 h-3.5" />,    title: "Bold" },
                  { tag: "i",     icon: <Italic className="w-3.5 h-3.5" />,  title: "Italic" },
                  { tag: "quote", icon: <Quote className="w-3.5 h-3.5" />,   title: "Quote" },
                  { tag: "code",  icon: <Code className="w-3.5 h-3.5" />,    title: "Code" },
                  { tag: "link",  icon: <LinkIcon className="w-3.5 h-3.5" />,title: "Link" },
                ].map(({ tag, icon, title }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertFormat(tag)}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                    title={title}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <textarea
                ref={replyBoxRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply to this discussion…"
                rows={5}
                className="w-full bg-[#161622] border border-[#2b2b3a] rounded-b p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-y"
                required
              />

              <div className="mt-3 flex items-center justify-between">
                <Link
                  href={communitySlug ? `/forum/${communitySlug}` : "/forum"}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to forum
                </Link>

                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="flex items-center gap-2 px-6 py-2 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] disabled:opacity-50 text-white shadow-xl transition-all"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {submitting ? "Posting…" : "Post reply"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
