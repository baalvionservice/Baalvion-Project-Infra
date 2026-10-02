"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, ChevronRight, Send, Bold, Italic, Link as LinkIcon, Quote, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createNewThread, findSubNode } from "@/lib/forum-store";

const PREFIXES = [
  { label: "VIP METHOD", color: "border-red-600 bg-red-950/60 text-red-400" },
  { label: "GUIDE", color: "border-emerald-600 bg-emerald-950/60 text-emerald-400" },
  { label: "TUTORIAL", color: "border-amber-600 bg-amber-950/60 text-amber-400" },
  { label: "DISCUSSION", color: "border-blue-600 bg-blue-950/60 text-blue-400" },
  { label: "RESOURCE", color: "border-purple-600 bg-purple-950/60 text-purple-400" },
];

export default function CreateThreadPage({
  params,
}: {
  params: Promise<{ communitySlug: string }>;
}) {
  const { communitySlug } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [prefix, setPrefix] = useState("DISCUSSION");
  const [authorName, setAuthorName] = useState("ProMember");
  const [submitting, setSubmitting] = useState(false);

  const subNodeData = findSubNode(communitySlug);
  const subNodeName = subNodeData?.subNode.name || communitySlug;
  const categoryTitle = subNodeData?.category.title || "Forums";

  const handleFormat = (tag: string) => {
    if (tag === "b") setContent((prev) => prev + " **bold text** ");
    if (tag === "i") setContent((prev) => prev + " *italic text* ");
    if (tag === "quote") setContent((prev) => prev + "\n> Quoted text here\n");
    if (tag === "code") setContent((prev) => prev + "\n```\ncode block\n```\n");
    if (tag === "link") setContent((prev) => prev + " [Link Title](https://example.com) ");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const newThread = createNewThread({
        subforumSlug: communitySlug,
        title: title.trim(),
        prefix,
        content: content.trim(),
        authorUsername: authorName.trim() || "Member",
      });

      toast({
        title: "Thread Posted Successfully!",
        description: `Your thread has been posted in ${subNodeName}.`,
      });

      router.push(`/forum/thread/${newThread.tid}?c=${communitySlug}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error posting thread",
        description: "Please check your input and try again.",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-[#121217] px-4 py-2.5 rounded border border-[#232330]">
          <Link href="/forum" className="hover:text-red-400 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-red-500" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href="/forum" className="hover:text-red-400">
            Forums
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href={`/forum/${communitySlug}`} className="hover:text-red-400">
            {subNodeName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-gray-200 font-semibold">Post Thread</span>
        </div>

        {/* Form Card */}
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
              <ArrowLeft className="w-3.5 h-3.5" /> Back to forum
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Posting As
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full sm:w-72 bg-[#181824] border border-[#2b2b3a] rounded px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                placeholder="Your username"
                required
              />
            </div>

            {/* Prefix Selection */}
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

            {/* Content with Toolbar */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Message Content
              </label>

              {/* BBCode Toolbar */}
              <div className="flex items-center gap-1 bg-[#1c1c28] border border-[#2b2b3a] border-b-0 rounded-t px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => handleFormat("b")}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat("i")}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat("link")}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                  title="Insert Link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat("quote")}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                  title="Insert Quote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat("code")}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                  title="Insert Code"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
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

            {/* Action Buttons */}
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
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Publishing…" : "Post thread"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
