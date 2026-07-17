"use client"

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NexusCard } from "@/components/ui/nexus-card";
import { NexusButton } from "@/components/ui/nexus-button";
import { useToast } from "@/hooks/use-toast";
import { createThread } from "@/lib/api/community";

export default function CreateThreadPage({ params }: { params: Promise<{ communitySlug: string }> }) {
  const { communitySlug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const result = await createThread(communitySlug, title.trim(), content.trim());
      toast({ title: "Discussion started" });
      router.push(`/forum/thread/${result.tid}?c=${communitySlug}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't start discussion", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-44 pb-32 max-w-3xl">
      <Link href={`/forum/${communitySlug}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-cyan-400 transition-colors mb-12">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-4xl font-bold mb-10">Start a Discussion</h1>
      <NexusCard className="p-10 border-white/5 bg-white/[0.02] space-y-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500/50 transition-all"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post…"
          className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm outline-none focus:border-cyan-500/50 transition-all resize-none"
        />
        <div className="flex justify-end">
          <NexusButton onClick={handleSubmit} isLoading={submitting} disabled={!title.trim() || !content.trim()} className="px-10 h-14 nexus-gradient-bg font-bold">
            Post Discussion
          </NexusButton>
        </div>
      </NexusCard>
    </div>
  );
}
