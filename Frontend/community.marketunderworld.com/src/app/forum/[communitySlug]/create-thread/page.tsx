"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Home, ChevronRight, Send, Bold, Italic,
  Link as LinkIcon, Quote, Code, Loader2, ShieldOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { getCommunity, createThread, type CommunityDetail } from "@/lib/api/community";

const PREFIXES = [
  { label: "VIP METHOD",  color: "border-red-600 bg-red-950/60 text-red-400" },
  { label: "GUIDE",       color: "border-emerald-600 bg-emerald-950/60 text-emerald-400" },
  { label: "TUTORIAL",    color: "border-amber-600 bg-amber-950/60 text-amber-400" },
  { label: "DISCUSSION",  color: "border-blue-600 bg-blue-950/60 text-blue-400" },
  { label: "RESOURCE",    color: "border-purple-600 bg-purple-950/60 text-purple-400" },
];

export default function CreateThreadPage({
  params,
}: {
  params: Promise<{ communitySlug: string }>;
}) {
  const { communitySlug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [prefix, setPrefix] = useState("DISCUSSION");
  const [threadType, setThreadType] = useState<"discussion" | "question">("discussion");
  const [submitting, setSubmitting] = useState(false);

  // Load community & verify membership
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth/signin?next=/forum/${communitySlug}/create-thread`);
      return;
    }
    (async () => {
      setPageLoading(true);
      const c = await getCommunity(communitySlug);
      setCommunity(c);
      setPageLoading(false);
      // Redirect if not an approved member
      const ms = c?.membership;
      if (!ms || (ms.status !== "approved" && ms.status !== "paid")) {
        router.replace(`/forum/${communitySlug}`);
      }
    })();
  }, [authLoading, isAuthenticated, communitySlug]);

  const handleFormat = (tag: string) => {
    if (tag === "b")     setContent((p) => p + " **bold text** ");
    if (tag === "i")     setContent((p) => p + " *italic text* ");
    if (tag === "quote") setContent((p) => p + "\n> Quoted text here\n");
    if (tag === "code")  setContent((p) => p + "\n```\ncode block\n```\n");
    if (tag === "link")  setContent((p) => p + " [Link Title](https://example.com) ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const { tid } = await createThread(communitySlug, title.trim(), content.trim(), threadType);
      toast({
        title: "Thread posted!",
        description: `"${title.trim()}" is now live in ${community?.name ?? communitySlug}.`,
      });
      router.push(`/forum/thread/${tid}?c=${communitySlug}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Couldn't post thread",
        description: err?.message ?? "Please try again.",
      });
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#06040a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  // Not a member — shouldn't reach here (redirect happens above), but guard anyway
  const ms = community?.membership;
  if (!ms || (ms.status !== "approved" && ms.status !== "paid")) {
    return (
      <div className="min-h-screen bg-[#06040a] flex flex-col items-center justify-center text-center px-6">
        <ShieldOff className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6">You must be an approved member to post in this community.</p>
        <Link href={`/forum/${communitySlug}`} className="text-red-400 hover:underline text-sm font-semibold">
          ← Back to community
        </Link>
      </div>
    );
  }

  const subNodeName = community?.name ?? communitySlug;

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-[#121217] px-4 py-2.5 rounded border border-[#232330]">
          <Link href="/forum" className="hover:text-red-400 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-red-500" /><span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href="/forum" className="hover:text-red-400">Forums</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href={`/forum/${communitySlug}`} className="hover:text-red-400">{subNodeName}</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-gray-200 font-semibold">Post Thread</span>
        </div>

        {/* Form card */}
        <div className="rounded-lg border border-[#2b2b3a] bg-[#121218] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#242432] pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Post Thread in {subNodeName}</h1>
              <p className="text-xs text-gray-400 mt-1">
                Share methods, strategies, ask questions, or provide educational resources.
              </p>
            </div>
            <Link
              href={`/forum/${communitySlug}`}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thread type */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Thread Type
              </label>
              <div className="flex gap-3">
                {(["discussion", "question"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setThreadType(t)}
                    className={`px-4 py-1.5 rounded text-xs font-bold border transition-all ${
                      threadType === t
                        ? "border-red-600 bg-red-950/60 text-red-300 ring-1 ring-red-500/40"
                        : "border-[#2b2b3a] bg-[#181822] text-gray-400 hover:text-white"
                    }`}
                  >
                    {t === "discussion" ? "💬 Discussion" : "❓ Q&A"}
                  </button>
                ))}
              </div>
            </div>

            {/* Prefix */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Thread Prefix
              </label>
              <div className="flex flex-wrap gap-2">
                {PREFIXES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPrefix(p.label)}
                    className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                      prefix === p.label
                        ? `${p.color} ring-2 ring-white/30 scale-105`
                        : "border-[#2b2b3a] bg-[#181822] text-gray-400 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Thread Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your thread a clear, descriptive title…"
                className="w-full bg-[#181824] border border-[#2b2b3a] rounded px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                required
              />
            </div>

            {/* Content with toolbar */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Message Content
              </label>
              <div className="flex items-center gap-1 bg-[#1c1c28] border border-[#2b2b3a] border-b-0 rounded-t px-3 py-1.5">
                {[
                  { tag: "b",     icon: <Bold className="w-3.5 h-3.5" />,    title: "Bold" },
                  { tag: "i",     icon: <Italic className="w-3.5 h-3.5" />,  title: "Italic" },
                  { tag: "link",  icon: <LinkIcon className="w-3.5 h-3.5" />,title: "Insert Link" },
                  { tag: "quote", icon: <Quote className="w-3.5 h-3.5" />,   title: "Quote" },
                  { tag: "code",  icon: <Code className="w-3.5 h-3.5" />,    title: "Code" },
                ].map(({ tag, icon, title: t }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleFormat(tag)}
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                    title={t}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your discussion or guide here…"
                rows={9}
                className="w-full bg-[#181824] border border-[#2b2b3a] rounded-b p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-y"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href={`/forum/${communitySlug}`}
                className="px-4 py-2 rounded text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] disabled:opacity-50 text-white shadow-xl transition-all"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {submitting ? "Publishing…" : "Post Thread"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
