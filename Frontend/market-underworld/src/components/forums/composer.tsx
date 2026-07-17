"use client"

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { NexusCard } from "@/components/ui/nexus-card";
import { NexusButton } from "@/components/ui/nexus-button";
import { useToast } from "@/hooks/use-toast";

interface ComposerProps {
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (content: string) => Promise<void>;
  onSuccess?: () => void;
}

/** Real reply/new-post composer — replaces the dead textarea in the old forum/thread page
 * and the fake setTimeout-simulated one from the now-deleted /forums tree. */
export function Composer({ placeholder = "Write your response...", submitLabel = "Post Reply", onSubmit, onSuccess }: ComposerProps) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
      toast({ title: "Posted", description: "Your reply is live." });
      onSuccess?.();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't post", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NexusCard className="p-10 border-cyan-500/20 bg-cyan-500/5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm outline-none focus:border-cyan-500/50 transition-all resize-none"
        placeholder={placeholder}
      />
      <div className="flex justify-end mt-6">
        <NexusButton onClick={handleSubmit} isLoading={submitting} disabled={!content.trim()} className="px-10 h-14 nexus-gradient-bg font-bold">
          {submitLabel} <ArrowRight className="ml-2 w-4 h-4" />
        </NexusButton>
      </div>
    </NexusCard>
  );
}
