"use client";

import React, { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

const STORAGE_KEY = 'law-elite-voter-token';
const VOTED_KEY_PREFIX = 'law-elite-feedback-vote:';

function getVoterToken(): string {
  try {
    let token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, token);
    }
    return token;
  } catch {
    // Private browsing / storage blocked -- a fresh token per visit still lets
    // the vote count, it just won't dedupe across this reader's future visits.
    return crypto.randomUUID();
  }
}

interface Summary {
  helpful: number;
  notHelpful: number;
}

/**
 * "Was this helpful?" widget. Counts shown are a live read from cms-service
 * (GET .../feedback) -- never fabricated -- so the section renders nothing
 * until that first fetch resolves, and stays quiet on failure rather than
 * showing a fake number.
 */
export function ArticleFeedback({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [voted, setVoted] = useState<'helpful' | 'not_helpful' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cms/articles/${encodeURIComponent(slug)}/feedback`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j?.data) setSummary(j.data);
      })
      .catch(() => {});
    try {
      const prior = localStorage.getItem(VOTED_KEY_PREFIX + slug);
      if (prior === 'helpful' || prior === 'not_helpful') setVoted(prior);
    } catch {}
    return () => { cancelled = true; };
  }, [slug]);

  async function vote(choice: 'helpful' | 'not_helpful') {
    if (voted || loading) return;
    setLoading(true);
    const voterToken = getVoterToken();
    try {
      const r = await fetch(`/api/cms/articles/${encodeURIComponent(slug)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: choice, voterToken }),
      });
      const j = await r.json();
      if (j?.data) setSummary(j.data);
      setVoted(choice);
      try { localStorage.setItem(VOTED_KEY_PREFIX + slug, choice); } catch {}
    } catch {
      // Network failure -- leave voted unset so the reader can try again.
    } finally {
      setLoading(false);
    }
  }

  const total = summary ? summary.helpful + summary.notHelpful : 0;

  return (
    <section className="border border-slate-100 rounded-lg px-6 py-5">
      <p className="text-[15px] font-bold text-slate-900 mb-3">Was this article helpful?</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => vote('helpful')}
          disabled={!!voted || loading}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
            voted === 'helpful'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700 disabled:opacity-60'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" /> Yes
        </button>
        <button
          type="button"
          onClick={() => vote('not_helpful')}
          disabled={!!voted || loading}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
            voted === 'not_helpful'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700 disabled:opacity-60'
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" /> No
        </button>
        {voted && <span className="text-[13px] text-slate-400">Thanks for the feedback.</span>}
      </div>
      {summary && total > 0 && (
        <p className="mt-3 text-[12.5px] text-slate-400">
          {summary.helpful} of {total} reader{total === 1 ? '' : 's'} found this helpful.
        </p>
      )}
    </section>
  );
}
