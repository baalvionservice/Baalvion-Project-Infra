"use client";

import React, { use, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Heart,
  Quote,
  Reply,
  Flag,
  Share2,
  Bookmark,
  Send,
  Bold,
  Italic,
  Link as LinkIcon,
  Code,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getThreadById,
  addReplyToThread,
  toggleLikePost,
  findSubNode,
} from "@/lib/forum-store";
import type { ForumThreadItem, ForumReplyItem } from "@/lib/forum-data";

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const communitySlug = searchParams.get("c") || "earnings-schemes";
  const { toast } = useToast();

  const [thread, setThread] = useState<ForumThreadItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [quotedSnippet, setQuotedSnippet] = useState<{ author: string; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [opLiked, setOpLiked] = useState(false);
  const [opLikes, setOpLikes] = useState(38);

  const replyBoxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadedThread = getThreadById(id);
    if (loadedThread) {
      setThread(loadedThread);
    } else {
      // Fallback thread if opened directly with random id
      setThread({
        tid: id,
        subforumSlug: communitySlug,
        title: "[VIP METHOD] $3K+/Month with Automated Micro-SaaS & Affiliate Flow",
        prefix: "VIP METHOD",
        prefixColor: "red",
        author: {
          username: "altoooi",
          avatarColor: "#c0392b",
          avatarLetter: "A",
          rank: "VIP MEMBER",
          rankColor: "#e74c3c",
          joinDate: "Jan 14, 2022",
          messagesCount: 1428,
          reactionScore: 894,
          isOnline: true,
        },
        date: "Today at 4:12 AM",
        views: 4892,
        replies: 0,
        originalPost: {
          content: "Welcome to this discussion thread. Detailed methodology for members.",
          signature: "⚡ Knowledge is freedom.",
        },
        posts: [],
      });
    }
    setLoading(false);
  }, [id, communitySlug]);

  const subNodeData = findSubNode(thread?.subforumSlug || communitySlug);
  const subNodeName = subNodeData?.subNode.name || "Earnings schemes";
  const categoryTitle = subNodeData?.category.title || "Making Money and Courses";
  const categorySlug = subNodeData?.category.slug || "making-money-and-courses";

  const handleQuote = (author: string, text: string) => {
    setQuotedSnippet({ author, text });
    replyBoxRef.current?.scrollIntoView({ behavior: "smooth" });
    replyBoxRef.current?.focus();
    toast({ title: `Quoting @${author}`, description: "Quote added to fast reply box." });
  };

  const handleOpLike = () => {
    if (!opLiked) {
      setOpLikes((prev) => prev + 1);
      setOpLiked(true);
      toast({ title: "Reaction Added", description: "You liked this post." });
    }
  };

  const handleReplyLike = (pid: string) => {
    toggleLikePost(thread!.tid, pid);
    const updated = getThreadById(thread!.tid);
    if (updated) setThread({ ...updated });
    toast({ title: "Post Liked!" });
  };

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !thread) return;

    setSubmitting(true);
    try {
      addReplyToThread(thread.tid, replyContent.trim(), quotedSnippet || undefined);
      const updated = getThreadById(thread.tid);
      if (updated) {
        setThread({ ...updated });
      }
      setReplyContent("");
      setQuotedSnippet(null);
      toast({
        title: "Reply Published",
        description: "Your post has been added to the discussion.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to post reply",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const insertFormat = (tag: string) => {
    if (tag === "b") setReplyContent((prev) => prev + " **bold** ");
    if (tag === "i") setReplyContent((prev) => prev + " *italic* ");
    if (tag === "quote") setReplyContent((prev) => prev + "\n> Quote snippet\n");
    if (tag === "code") setReplyContent((prev) => prev + "\n```\ncode\n```\n");
    if (tag === "link") setReplyContent((prev) => prev + " [Link](https://example.com) ");
  };

  if (loading || !thread) {
    return (
      <div className="min-h-screen bg-[#06040a] text-gray-400 flex items-center justify-center">
        Loading discussion thread…
      </div>
    );
  }

  const prefixBg =
    thread.prefixColor === "red"
      ? "bg-red-950/70 border-red-800/80 text-red-400"
      : thread.prefixColor === "green"
      ? "bg-emerald-950/70 border-emerald-800/80 text-emerald-400"
      : "bg-blue-950/70 border-blue-800/80 text-blue-400";

  return (
    <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* XenForo Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-[#121217] px-4 py-2.5 rounded border border-[#232330] flex-wrap">
          <Link href="/forum" className="hover:text-red-400 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-red-500" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href="/forum" className="hover:text-red-400">
            Forums
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href={`/forum/category/${categorySlug}`} className="hover:text-red-400">
            {categoryTitle}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href={`/forum/${thread.subforumSlug}`} className="hover:text-red-400">
            {subNodeName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-gray-200 font-semibold truncate max-w-xs">{thread.title}</span>
        </div>

        {/* Thread Header Banner */}
        <div className="mb-6 pb-4 border-b border-[#232330]">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {thread.prefix && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${prefixBg}`}>
                {thread.prefix}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {thread.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span>Started by</span>
              <span className="text-red-400 font-semibold">{thread.author.username}</span>
            </div>
            <span className="opacity-40">·</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>{thread.date}</span>
            </div>
            <span className="opacity-40">·</span>
            <div>Replies: <strong className="text-gray-200">{thread.posts.length}</strong></div>
            <span className="opacity-40">·</span>
            <div>Views: <strong className="text-gray-200">{thread.views.toLocaleString()}</strong></div>
          </div>
        </div>

        {/* POSTS STREAM */}
        <div className="space-y-4 mb-8">
          {/* Post #1 (Original Post) */}
          <div className="rounded-lg border border-[#272736] bg-[#121218] overflow-hidden shadow-xl flex flex-col md:flex-row">
            {/* Left Column: Author Card */}
            <div className="md:w-52 shrink-0 p-5 bg-[#161620] border-b md:border-b-0 md:border-r border-[#242432] flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-3">
                <div
                  className="w-20 h-20 rounded-md flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                  style={{ backgroundColor: thread.author.avatarColor || "#c0392b" }}
                >
                  {thread.author.avatarLetter || thread.author.username[0].toUpperCase()}
                </div>
                {thread.author.isOnline && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#161620]"
                    title="Online now"
                  />
                )}
              </div>

              {/* Username */}
              <div className="text-base font-bold text-white mb-1 hover:text-red-400 transition-colors">
                {thread.author.username}
              </div>

              {/* User Rank Badge */}
              <div
                className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded mb-3 border shadow-sm"
                style={{
                  color: thread.author.rankColor || "#e74c3c",
                  borderColor: `${thread.author.rankColor || "#e74c3c"}44`,
                  backgroundColor: `${thread.author.rankColor || "#e74c3c"}15`,
                }}
              >
                {thread.author.rank}
              </div>

              {/* Stats */}
              <div className="w-full text-[11px] text-gray-400 space-y-1.5 border-t border-[#232330] pt-3 text-left">
                <div className="flex justify-between">
                  <span>Joined:</span>
                  <span className="text-gray-200 font-medium">{thread.author.joinDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="text-gray-200 font-medium">{thread.author.messagesCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reactions:</span>
                  <span className="text-amber-400 font-medium">{thread.author.reactionScore}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Post Body */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                {/* Post Top Metadata Bar */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232330] text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 font-medium">{thread.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-500">#1</span>
                    <button className="hover:text-white" title="Bookmark">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button className="hover:text-white" title="Share">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="text-sm text-[#d4cfc7] leading-relaxed whitespace-pre-line space-y-4">
                  {thread.originalPost.content}
                </div>

                {/* Signature Divider */}
                {thread.originalPost.signature && (
                  <div className="mt-8 pt-4 border-t border-dashed border-[#242432] text-xs italic text-gray-500">
                    {thread.originalPost.signature}
                  </div>
                )}
              </div>

              {/* Post Action Reaction Bar */}
              <div className="mt-6 pt-4 border-t border-[#232330] flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                      opLiked
                        ? "bg-red-950/80 text-red-400 border border-red-800"
                        : "bg-[#1a1a24] text-gray-400 hover:text-red-400 hover:bg-[#20202c]"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${opLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span>Like ({opLikes})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuote(thread.author.username, thread.originalPost.content.slice(0, 140))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#1a1a24] hover:bg-[#20202c] text-gray-300 hover:text-white transition-colors"
                  >
                    <Quote className="w-3 h-3 text-red-400" />
                    <span>Quote</span>
                  </button>
                  <button
                    onClick={() => replyBoxRef.current?.focus()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#1a1a24] hover:bg-[#20202c] text-gray-300 hover:text-white transition-colors"
                  >
                    <Reply className="w-3 h-3 text-cyan-400" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Subsequent Post Replies */}
          {thread.posts.map((post) => (
            <div
              key={post.pid}
              className="rounded-lg border border-[#272736] bg-[#121218] overflow-hidden shadow-xl flex flex-col md:flex-row"
            >
              {/* Author Card */}
              <div className="md:w-52 shrink-0 p-5 bg-[#161620] border-b md:border-b-0 md:border-r border-[#242432] flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div
                    className="w-16 h-16 rounded-md flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ backgroundColor: post.author.avatarColor || "#2980b9" }}
                  >
                    {post.author.avatarLetter || post.author.username[0].toUpperCase()}
                  </div>
                  {post.author.isOnline && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161620]" />
                  )}
                </div>

                <div className="text-sm font-bold text-white mb-1 hover:text-red-400 transition-colors">
                  {post.author.username}
                </div>

                <div
                  className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded mb-3 border shadow-sm"
                  style={{
                    color: post.author.rankColor || "#3498db",
                    borderColor: `${post.author.rankColor || "#3498db"}44`,
                    backgroundColor: `${post.author.rankColor || "#3498db"}15`,
                  }}
                >
                  {post.author.rank}
                </div>

                <div className="w-full text-[11px] text-gray-400 space-y-1.5 border-t border-[#232330] pt-3 text-left">
                  <div className="flex justify-between">
                    <span>Joined:</span>
                    <span className="text-gray-200">{post.author.joinDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Messages:</span>
                    <span className="text-gray-200">{post.author.messagesCount}</span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232330] text-xs text-gray-400">
                    <span className="text-gray-300 font-medium">{post.date}</span>
                    <span className="font-bold text-gray-500">#{post.postNumber}</span>
                  </div>

                  {/* Quoted block if any */}
                  {post.quote && (
                    <div className="mb-4 p-3 rounded bg-[#191924] border-l-4 border-red-500 text-xs text-gray-300 italic">
                      <div className="font-bold text-red-400 mb-1 not-italic">
                        {post.quote.author} said:
                      </div>
                      "{post.quote.text}"
                    </div>
                  )}

                  <div className="text-sm text-[#d4cfc7] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </div>
                </div>

                {/* Reaction Bar */}
                <div className="mt-6 pt-4 border-t border-[#232330] flex items-center justify-between flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => handleReplyLike(post.pid)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a24] hover:bg-[#20202c] text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Like ({post.likes || 0})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuote(post.author.username, post.content.slice(0, 120))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#1a1a24] hover:bg-[#20202c] text-gray-300 hover:text-white"
                    >
                      <Quote className="w-3 h-3 text-red-400" />
                      <span>Quote</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAST REPLY BOX (XenForo Style) */}
        <div className="rounded-lg border border-[#2b2b3b] bg-[#121218] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 text-sm font-bold text-white">
            <Reply className="w-4 h-4 text-red-500" />
            <span>Fast Reply</span>
          </div>

          {quotedSnippet && (
            <div className="mb-3 p-3 rounded bg-[#1a1a26] border-l-4 border-red-500 flex items-center justify-between text-xs text-gray-300">
              <div>
                <span className="font-bold text-red-400">Replying to {quotedSnippet.author}:</span>{" "}
                "{quotedSnippet.text}…"
              </div>
              <button
                onClick={() => setQuotedSnippet(null)}
                className="text-gray-400 hover:text-white ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handlePostReply}>
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 bg-[#1a1a26] border border-[#2b2b3a] border-b-0 rounded-t px-3 py-1.5">
              <button
                type="button"
                onClick={() => insertFormat("b")}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat("i")}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat("quote")}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="Quote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat("code")}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="Code"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat("link")}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="Link"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
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
                href={`/forum/${thread.subforumSlug}`}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {subNodeName}
              </Link>

              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
                className="flex items-center gap-2 px-6 py-2 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] disabled:opacity-50 text-white shadow-xl transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Posting…" : "Post reply"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
