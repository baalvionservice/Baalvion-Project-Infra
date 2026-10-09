"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home, ChevronRight, Pin, MessageSquare, Eye, PlusCircle,
  Bell, Search, Lock, Clock, ShieldOff, CheckCircle2, Users,
  LogIn, Send, Loader2,
} from "lucide-react";
import {
  getCommunity, getThreads, joinCommunity,
  type CommunityDetail, type ForumThread,
} from "@/lib/api/community";
import { useAuth } from "@/context/auth-context";

// ─── Access-state wall screens ───────────────────────────────────────────────

function WallScreen({ icon, title, body, action }: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-6 py-16">
      <div className="mb-6 w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-gray-400 max-w-md leading-relaxed mb-6">{body}</p>
      {action}
    </div>
  );
}

// ─── Thread row component (real data) ────────────────────────────────────────

function ThreadRow({ thread, communitySlug }: { thread: ForumThread; communitySlug: string }) {
  const date = new Date(thread.timestamp).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const avatar = thread.user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="group px-4 sm:px-5 py-3.5 bg-[#14141a] hover:bg-[#181824] transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center">
      {/* Title & Author */}
      <div className="md:col-span-7 flex items-start gap-3 w-full">
        <div className="w-9 h-9 shrink-0 rounded flex items-center justify-center text-white font-bold text-xs shadow-md mt-0.5 bg-[#c0392b]">
          {thread.user?.picture
            ? <img src={thread.user.picture} alt={avatar} className="w-9 h-9 rounded object-cover" />
            : avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {thread.threadType === "question" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase bg-blue-950/70 border-blue-800/80 text-blue-400">
                Q&amp;A
              </span>
            )}
            {thread.isAnswered && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <Link
              href={`/forum/thread/${thread.tid}?c=${communitySlug}`}
              className="text-sm font-semibold text-[#f0f0f5] group-hover:text-red-400 transition-colors line-clamp-1"
            >
              {thread.title}
            </Link>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
            <span className="text-gray-300 font-medium">{thread.user?.username ?? "Unknown"}</span>
            <span className="opacity-40">·</span>
            <span>{date}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="md:col-span-2 flex md:flex-col items-center justify-center gap-4 md:gap-0 text-center text-xs">
        <div className="text-gray-300 font-semibold flex items-center gap-1 md:block">
          <span>{thread.postcount}</span>
          <span className="text-[10px] text-gray-500 md:block ml-1 md:ml-0 uppercase">Replies</span>
        </div>
        <div className="text-gray-400 text-[11px] hidden md:block mt-0.5">
          {thread.viewcount.toLocaleString()} views
        </div>
      </div>

      {/* Last post */}
      <div className="md:col-span-3 flex items-center md:justify-end gap-2.5 text-right w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#22222e]">
        <div className="flex-1 md:flex-initial text-left md:text-right">
          <div className="text-xs text-gray-300 font-medium">{date}</div>
          <div className="text-[11px] text-gray-400 truncate">
            By <span className="text-red-400/90 font-medium">{thread.user?.username ?? "Unknown"}</span>
          </div>
        </div>
        <div className="w-7 h-7 shrink-0 rounded flex items-center justify-center text-white font-bold text-[10px] shadow bg-[#c0392b]">
          {avatar}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CommunityForumPage({
  params,
}: {
  params: Promise<{ communitySlug: string }>;
}) {
  const { communitySlug } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinedNow, setJoinedNow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "questions">("all");

  // Load community details (always — shows name/type even before join)
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setPageLoading(true);
      const c = await getCommunity(communitySlug);
      setCommunity(c);
      // Only fetch threads if user is an approved/paid member
      const ms = c?.membership;
      if (ms && (ms.status === "approved" || ms.status === "paid")) {
        const t = await getThreads(communitySlug);
        setThreads(t);
      }
      setPageLoading(false);
    })();
  }, [communitySlug, authLoading, joinedNow]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?next=/forum/${communitySlug}`);
      return;
    }
    setJoining(true);
    setJoinError("");
    try {
      await joinCommunity(communitySlug, joinMessage || undefined);
      setJoinedNow((v) => !v); // trigger reload
    } catch (err: any) {
      setJoinError(err?.message ?? "Could not submit request. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#06040a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  const name = community?.name ?? communitySlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const desc = community?.description ?? "Community discussion, guides, and member insights.";
  const accessModel = community?.accessModel ?? "request_approval";
  const membership = community?.membership;

  // ── NOT AUTHENTICATED ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb slug={communitySlug} name={name} />
          <ForumHeader name={name} desc={desc} accessModel={accessModel} />
          <WallScreen
            icon={<LogIn className="w-8 h-8 text-red-400" />}
            title="Sign in to access this community"
            body="Create an account or sign in to request access and participate in this forum."
            action={
              <Link
                href={`/auth/signin?next=/forum/${communitySlug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#c0392b] hover:bg-[#d63031] text-white font-bold rounded-lg text-sm transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign In / Register
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // ── NO MEMBERSHIP YET — free community auto-joins, otherwise show join form ─
  if (!membership) {
    if (accessModel === "free") {
      // Auto-trigger join
      return (
        <div className="min-h-screen bg-[#06040a] flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-3" />
            <p className="text-sm">Joining community…</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb slug={communitySlug} name={name} />
          <ForumHeader name={name} desc={desc} accessModel={accessModel} />
          <WallScreen
            icon={<Lock className="w-8 h-8 text-amber-400" />}
            title={accessModel === "invite_only" ? "Invite-only Community" : "Request Access to Join"}
            body={
              accessModel === "invite_only"
                ? "This community is invite-only. You need a member to invite you before you can participate."
                : `This community requires admin approval. Send a short note explaining why you'd like to join "${name}".`
            }
            action={
              accessModel === "request_approval" ? (
                <div className="w-full max-w-md">
                  <textarea
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="Introduce yourself briefly — why do you want to join? (optional)"
                    rows={3}
                    className="w-full bg-[#181824] border border-[#2b2b3a] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none mb-3"
                  />
                  {joinError && <p className="text-red-400 text-xs mb-3">{joinError}</p>}
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#c0392b] hover:bg-[#d63031] disabled:opacity-60 text-white font-bold rounded-lg text-sm transition-colors"
                  >
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {joining ? "Submitting…" : "Request to Join"}
                  </button>
                </div>
              ) : null
            }
          />
        </div>
      </div>
    );
  }

  // ── PENDING / REQUESTED ───────────────────────────────────────────────────
  if (membership.status === "requested" || membership.status === "invited") {
    return (
      <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb slug={communitySlug} name={name} />
          <ForumHeader name={name} desc={desc} accessModel={accessModel} />
          <WallScreen
            icon={<Clock className="w-8 h-8 text-amber-400" />}
            title="Your request is pending review"
            body="An admin will review your request shortly. You'll get access once approved. Check back here anytime."
            action={
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-sm">
                <Clock className="w-4 h-4" /> Awaiting Admin Approval
              </div>
            }
          />
        </div>
      </div>
    );
  }

  // ── REJECTED / BANNED ─────────────────────────────────────────────────────
  if (membership.status === "rejected" || membership.status === "banned" || membership.status === "cancelled") {
    return (
      <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb slug={communitySlug} name={name} />
          <ForumHeader name={name} desc={desc} accessModel={accessModel} />
          <WallScreen
            icon={<ShieldOff className="w-8 h-8 text-red-500" />}
            title={membership.status === "banned" ? "You have been banned" : "Access denied"}
            body={
              membership.status === "banned"
                ? "You have been banned from this community by a moderator."
                : "Your request to join was declined. Contact an admin if you believe this was an error."
            }
            action={
              <Link href="/forum" className="text-sm text-gray-400 hover:text-white underline">
                ← Back to all communities
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // ── APPROVED / PAID — show full forum ─────────────────────────────────────
  const filteredThreads = threads.filter((t) => {
    if (filter === "questions" && t.threadType !== "question") return false;
    if (searchQuery.trim()) {
      return (
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.user?.username ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const isMod = membership.role === "moderator" || membership.role === "admin";

  return (
    <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb slug={communitySlug} name={name} />

        {/* Header banner */}
        <div className="mb-6 p-6 rounded-lg bg-gradient-to-r from-[#171420] via-[#1a1725] to-[#14121c] border border-[#2b2538] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              {name}
              {isMod && (
                <span className="text-[10px] px-2 py-0.5 bg-purple-900/60 border border-purple-700/60 text-purple-300 rounded font-bold uppercase tracking-wider">
                  {membership.role}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">{desc}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isMod && (
              <Link
                href={`/admin/forum/members?community=${communitySlug}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-700/40 transition-colors"
              >
                <Users className="w-3.5 h-3.5" /> Manage
              </Link>
            )}
            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-[#211e2b] hover:bg-[#2d293b] text-gray-300 hover:text-white border border-[#373247] transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" /> Watch
            </button>
            <Link
              href={`/forum/${communitySlug}/create-thread`}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] text-white shadow-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Post Thread
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-[#111116] px-4 py-2.5 rounded border border-[#22222d]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(["all", "questions"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filter === f ? "bg-[#2b2738] text-white border border-[#443d57]" : "text-gray-400 hover:text-white"
                }`}
              >
                {f === "all" ? "All Threads" : "Q&A"}
              </button>
            ))}
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

        {/* Thread table */}
        <div className="rounded-lg overflow-hidden border border-[#272734] bg-[#121217] shadow-xl">
          <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-[#181822] border-b border-[#272734] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-7">Title / Thread Starter</div>
            <div className="col-span-2 text-center">Replies / Views</div>
            <div className="col-span-3 text-right">Last Message</div>
          </div>

          {filteredThreads.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto text-gray-600 mb-3" />
              <p className="text-sm font-medium">No discussions yet in this community.</p>
              <Link
                href={`/forum/${communitySlug}/create-thread`}
                className="mt-3 inline-block text-xs font-bold text-red-400 hover:underline"
              >
                Start the first discussion →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e28]">
              {filteredThreads.map((thread) => (
                <ThreadRow key={thread.tid} thread={thread} communitySlug={communitySlug} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom post button */}
        <div className="mt-6 flex justify-end">
          <Link
            href={`/forum/${communitySlug}/create-thread`}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] text-white shadow-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Post Thread
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Breadcrumb({ slug, name }: { slug: string; name: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-[#121217] px-4 py-2.5 rounded border border-[#232330] flex-wrap">
      <Link href="/forum" className="hover:text-red-400 flex items-center gap-1">
        <Home className="w-3.5 h-3.5 text-red-500" /><span>Home</span>
      </Link>
      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
      <Link href="/forum" className="hover:text-red-400">Forums</Link>
      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
      <span className="text-gray-200 font-semibold">{name}</span>
    </div>
  );
}

function ForumHeader({ name, desc, accessModel }: {
  name: string;
  desc: string;
  accessModel: string;
}) {
  const badge: Record<string, string> = {
    free: "Open",
    request_approval: "Request to Join",
    invite_only: "Invite Only",
    paid: "Premium",
  };
  return (
    <div className="mb-8 p-6 rounded-lg bg-gradient-to-r from-[#171420] via-[#1a1725] to-[#14121c] border border-[#2b2538] shadow-xl">
      <h1 className="text-3xl font-bold text-white">{name}</h1>
      <p className="text-sm text-gray-400 mt-2 mb-3">{desc}</p>
      <span className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded font-bold uppercase tracking-wider">
        {badge[accessModel] ?? "Community"}
      </span>
    </div>
  );
}
