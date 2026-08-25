"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { getVoterToken } from "@/lib/voter-token";
import { getTopicColor } from "@/lib/topic-colors";
import type { ArticlePoll as ArticlePollData } from "@/services/data/cms-public";

interface Props {
  slug: string;
  initialPoll: ArticlePollData;
  categoryName?: string;
}

function votedKey(pollId: string) {
  return `imperialpedia:poll-vote:${pollId}`;
}

export function ArticlePoll({ slug, initialPoll, categoryName }: Props) {
  const color = getTopicColor(categoryName);
  const [poll, setPoll] = useState(initialPoll);
  const [voted, setVoted] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(votedKey(poll.id));
      if (stored !== null) setVoted(Number(stored));
    } catch {
      // localStorage unavailable — vote still works, just not remembered.
    }
  }, [poll.id]);

  const castVote = async (optionIndex: number) => {
    if (voted !== null || submitting) return;
    setSubmitting(true);
    setVoted(optionIndex);
    try {
      window.localStorage.setItem(votedKey(poll.id), String(optionIndex));
    } catch {
      // Non-fatal.
    }
    try {
      const res = await fetch(`/api/article-engagement/${encodeURIComponent(slug)}/poll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex, voterToken: getVoterToken() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data) setPoll(data);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showResults = voted !== null;

  return (
    <div className="rounded-lg border border-border border-t-4 p-6" style={{ borderTopColor: color }}>
      <p className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
        <BarChart3 className="h-4 w-4" style={{ color }} />
        {poll.question}
      </p>
      <div className="space-y-2">
        {poll.options.map((option, i) => {
          const count = poll.counts[i] ?? 0;
          const pct = poll.total > 0 ? Math.round((count / poll.total) * 100) : 0;
          return (
            <button
              key={i}
              type="button"
              disabled={showResults}
              onClick={() => castVote(i)}
              className="relative block w-full overflow-hidden rounded-md border border-border text-left transition-colors disabled:cursor-default"
            >
              {showResults && (
                <div
                  className="absolute inset-y-0 left-0 transition-all"
                  style={{ width: `${pct}%`, backgroundColor: `${color}26` }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-foreground" style={voted === i ? { color, fontWeight: 700 } : undefined}>
                  {option}
                </span>
                {showResults && (
                  <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {showResults && (
        <p className="mt-3 text-xs text-muted-foreground">
          {poll.total} vote{poll.total === 1 ? "" : "s"} so far
        </p>
      )}
    </div>
  );
}
