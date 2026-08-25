"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { getVoterToken } from "@/lib/voter-token";
import { getTopicColor } from "@/lib/topic-colors";
import type { ArticleFeedbackSummary } from "@/services/data/cms-public";

type Vote = "helpful" | "not_helpful";

interface Props {
  slug: string;
  initialSummary: ArticleFeedbackSummary;
  categoryName?: string;
}

function votedKey(slug: string) {
  return `imperialpedia:feedback-vote:${slug}`;
}

export function HelpfulVote({ slug, initialSummary, categoryName }: Props) {
  const color = getTopicColor(categoryName);
  const [summary, setSummary] = useState(initialSummary);
  const [voted, setVoted] = useState<Vote | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(votedKey(slug));
      if (stored === "helpful" || stored === "not_helpful") setVoted(stored);
    } catch {
      // localStorage unavailable — vote still works, just not remembered.
    }
  }, [slug]);

  const castVote = async (vote: Vote) => {
    if (voted || submitting) return;
    setSubmitting(true);
    setVoted(vote);
    try {
      window.localStorage.setItem(votedKey(slug), vote);
    } catch {
      // Non-fatal — the vote still submits, it just won't be remembered on reload.
    }
    try {
      const res = await fetch(`/api/article-engagement/${encodeURIComponent(slug)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, voterToken: getVoterToken() }),
      });
      if (res.ok) setSummary(await res.json());
    } finally {
      setSubmitting(false);
    }
  };

  const total = summary.helpful + summary.notHelpful;

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-t-4 border-border py-6 text-center"
      style={{ borderTopColor: color, backgroundColor: `${color}0d` }}
    >
      <p className="text-sm font-bold text-foreground">Was this article helpful?</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => castVote("helpful")}
          disabled={voted !== null}
          aria-pressed={voted === "helpful"}
          className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-default"
          style={
            voted === "helpful"
              ? { borderColor: color, backgroundColor: color, color: "#fff" }
              : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
          }
        >
          <ThumbsUp className="h-4 w-4" />
          Yes
        </button>
        <button
          type="button"
          onClick={() => castVote("not_helpful")}
          disabled={voted !== null}
          aria-pressed={voted === "not_helpful"}
          className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-default"
          style={
            voted === "not_helpful"
              ? { borderColor: color, backgroundColor: color, color: "#fff" }
              : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
          }
        >
          <ThumbsDown className="h-4 w-4" />
          No
        </button>
      </div>
      {voted && (
        <p className="text-xs text-muted-foreground">
          Thanks for the feedback{total > 0 ? ` — ${summary.helpful} of ${total} readers found this helpful` : ""}.
        </p>
      )}
    </div>
  );
}
