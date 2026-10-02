"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home,
  ChevronRight,
  Pin,
  MessageSquare,
  Eye,
  PlusCircle,
  Bell,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { findSubNode, getThreadsForSubforum } from "@/lib/forum-store";
import type { ForumThreadItem } from "@/lib/forum-data";

export default function SubforumPage({
  params,
}: {
  params: Promise<{ communitySlug: string }>;
}) {
  const { communitySlug } = use(params);
  const [threads, setThreads] = useState<ForumThreadItem[]>([]);
  const [filter, setFilter] = useState<"all" | "pinned" | "popular">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [subNodeInfo, setSubNodeInfo] = useState<ReturnType<typeof findSubNode>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nodeData = findSubNode(communitySlug);
    setSubNodeInfo(nodeData);

    const forumThreads = getThreadsForSubforum(communitySlug);
    setThreads(forumThreads);
    setLoading(false);
  }, [communitySlug]);

  if (!loading && !subNodeInfo && threads.length === 0) {
    // If not found in mock store, we can still render a generic subforum shell
  }

  const subNode = subNodeInfo?.subNode || {
    slug: communitySlug,
    name: communitySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    description: "Community discussion, guides, and member insights.",
    iconType: "chat" as const,
    threadsCount: "1.2K",
    messagesCount: "14.5K",
    latestPost: {
      title: "Welcome to the section",
      author: "Admin",
      authorInitial: "A",
      avatarColor: "#c0392b",
      timestamp: "Today",
      tid: "welcome",
    },
  };

  const category = subNodeInfo?.category || {
    slug: "making-money-and-courses",
    title: "Making Money and Courses",
  };

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    if (filter === "pinned" && !t.isPinned) return false;
    if (filter === "popular" && (t.replies || 0) < 3) return false;
    if (searchQuery.trim()) {
      return (
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.author.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const pinnedThreads = filteredThreads.filter((t) => t.isPinned);
  const regularThreads = filteredThreads.filter((t) => !t.isPinned);

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
          <Link href={`/forum/category/${category.slug}`} className="hover:text-red-400">
            {category.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-gray-200 font-semibold">{subNode.name}</span>
        </div>

        {/* Subforum Header Banner */}
        <div className="mb-6 p-6 rounded-lg bg-gradient-to-r from-[#171420] via-[#1a1725] to-[#14121c] border border-[#2b2538] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>{subNode.name}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              {subNode.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => alert("You are now watching this forum for notifications.")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-[#211e2b] hover:bg-[#2d293b] text-gray-300 hover:text-white border border-[#373247] transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Watch</span>
            </button>

            <Link
              href={`/forum/${communitySlug}/create-thread`}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] text-white shadow-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post thread</span>
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-[#111116] px-4 py-2.5 rounded border border-[#22222d]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                filter === "all" ? "bg-[#2b2738] text-white border border-[#443d57]" : "text-gray-400 hover:text-white"
              }`}
            >
              All Threads
            </button>
            <button
              onClick={() => setFilter("pinned")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                filter === "pinned" ? "bg-[#2b2738] text-white border border-[#443d57]" : "text-gray-400 hover:text-white"
              }`}
            >
              Pinned
            </button>
            <button
              onClick={() => setFilter("popular")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                filter === "popular" ? "bg-[#2b2738] text-white border border-[#443d57]" : "text-gray-400 hover:text-white"
              }`}
            >
              Most Active
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this forum…"
              className="w-full bg-[#181822] border border-[#2b2b3a] rounded pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/60"
            />
          </div>
        </div>

        {/* Thread Table Container */}
        <div className="rounded-lg overflow-hidden border border-[#272734] bg-[#121217] shadow-xl">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-[#181822] border-b border-[#272734] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-7">Title / Thread Starter</div>
            <div className="col-span-2 text-center">Replies / Views</div>
            <div className="col-span-3 text-right">Last Message</div>
          </div>

          {/* Sticky Threads Section */}
          {pinnedThreads.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-[#1b1724] border-b border-[#2b2438] text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3 text-red-500" />
                <span>Sticky Threads</span>
              </div>
              <div className="divide-y divide-[#20202b]">
                {pinnedThreads.map((thread) => (
                  <ThreadRow key={thread.tid} thread={thread} communitySlug={communitySlug} />
                ))}
              </div>
            </div>
          )}

          {/* Regular Threads Section */}
          {regularThreads.length > 0 ? (
            <div>
              {pinnedThreads.length > 0 && (
                <div className="px-5 py-2 bg-[#16161e] border-b border-[#272734] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Normal Threads
                </div>
              )}
              <div className="divide-y divide-[#1e1e28]">
                {regularThreads.map((thread) => (
                  <ThreadRow key={thread.tid} thread={thread} communitySlug={communitySlug} />
                ))}
              </div>
            </div>
          ) : pinnedThreads.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto text-gray-600 mb-3" />
              <p className="text-sm font-medium">No discussions found matching your filter.</p>
              <Link
                href={`/forum/${communitySlug}/create-thread`}
                className="mt-3 inline-block text-xs font-bold text-red-400 hover:underline"
              >
                Start the first discussion in {subNode.name} →
              </Link>
            </div>
          ) : null}
        </div>

        {/* Bottom Pagination & Post Button */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-1 text-xs">
            <span className="px-3 py-1.5 rounded bg-[#c0392b] text-white font-bold">1</span>
            <button className="px-3 py-1.5 rounded bg-[#181822] border border-[#2b2b3a] text-gray-400 hover:text-white transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 rounded bg-[#181822] border border-[#2b2b3a] text-gray-400 hover:text-white transition-colors">
              3
            </button>
            <button className="px-3 py-1.5 rounded bg-[#181822] border border-[#2b2b3a] text-gray-400 hover:text-white transition-colors">
              Next &gt;
            </button>
          </div>

          <Link
            href={`/forum/${communitySlug}/create-thread`}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] text-white shadow-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post thread</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  communitySlug,
}: {
  thread: ForumThreadItem;
  communitySlug: string;
}) {
  const prefixBg =
    thread.prefixColor === "red"
      ? "bg-red-950/70 border-red-800/80 text-red-400"
      : thread.prefixColor === "green"
      ? "bg-emerald-950/70 border-emerald-800/80 text-emerald-400"
      : thread.prefixColor === "purple"
      ? "bg-purple-950/70 border-purple-800/80 text-purple-400"
      : "bg-blue-950/70 border-blue-800/80 text-blue-400";

  const lastPost =
    thread.posts && thread.posts.length > 0
      ? thread.posts[thread.posts.length - 1]
      : null;

  return (
    <div className="group px-4 sm:px-5 py-3.5 bg-[#14141a] hover:bg-[#181824] transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center">
      {/* Title & Author Column */}
      <div className="md:col-span-7 flex items-start gap-3 w-full">
        {/* Author Avatar */}
        <div
          className="w-9 h-9 shrink-0 rounded flex items-center justify-center text-white font-bold text-xs shadow-md mt-0.5"
          style={{ backgroundColor: thread.author.avatarColor || "#c0392b" }}
        >
          {thread.author.avatarLetter || thread.author.username[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {thread.isPinned && (
              <Pin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            )}
            {thread.prefix && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase ${prefixBg}`}
              >
                {thread.prefix}
              </span>
            )}
            <Link
              href={`/forum/thread/${thread.tid}?c=${communitySlug}`}
              className="text-sm font-semibold text-[#f0f0f5] group-hover:text-red-400 transition-colors line-clamp-1"
            >
              {thread.title}
            </Link>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1 flex-wrap">
            <span className="text-gray-300 font-medium">{thread.author.username}</span>
            <span className="opacity-40">·</span>
            <span>{thread.date}</span>
          </div>
        </div>
      </div>

      {/* Replies & Views Column */}
      <div className="md:col-span-2 flex md:flex-col items-center justify-center gap-4 md:gap-0 text-center text-xs">
        <div className="text-gray-300 font-semibold flex items-center gap-1 md:block">
          <span>{thread.replies || 0}</span>
          <span className="text-[10px] text-gray-500 md:block ml-1 md:ml-0 uppercase">
            Replies
          </span>
        </div>
        <div className="text-gray-400 text-[11px] hidden md:block mt-0.5">
          {thread.views.toLocaleString()} views
        </div>
      </div>

      {/* Last Message Column */}
      <div className="md:col-span-3 flex items-center md:justify-end gap-2.5 text-right w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#22222e]">
        <div className="flex-1 md:flex-initial text-left md:text-right">
          <div className="text-xs text-gray-300 font-medium">
            {lastPost ? lastPost.date : thread.date}
          </div>
          <div className="text-[11px] text-gray-400 truncate">
            <span>By </span>
            <span className="text-red-400/90 font-medium">
              {lastPost ? lastPost.author.username : thread.author.username}
            </span>
          </div>
        </div>

        <div
          className="w-7 h-7 shrink-0 rounded flex items-center justify-center text-white font-bold text-[10px] shadow"
          style={{
            backgroundColor: lastPost
              ? lastPost.author.avatarColor
              : thread.author.avatarColor || "#c0392b",
          }}
        >
          {lastPost
            ? lastPost.author.avatarLetter
            : thread.author.avatarLetter}
        </div>
      </div>
    </div>
  );
}
