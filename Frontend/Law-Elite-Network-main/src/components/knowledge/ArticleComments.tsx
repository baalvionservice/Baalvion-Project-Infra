"use client";

import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface Comment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/**
 * Reader comment thread. Submitted comments are held for moderation on the
 * backend (status 'pending') -- this list only ever shows what GET .../comments
 * returns, i.e. already-approved comments, never the reader's own pending one
 * echoed back as if it were live.
 */
export function ArticleComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitted' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cms/articles/${encodeURIComponent(slug)}/comments`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (Array.isArray(j?.data)) setComments(j.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    setStatus('idle');
    try {
      const r = await fetch(`/api/cms/articles/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: name.trim(), authorEmail: email.trim(), body: body.trim() }),
      });
      if (!r.ok) throw new Error('failed');
      setStatus('submitted');
      setName('');
      setEmail('');
      setBody('');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-t border-slate-100 pt-8">
      <h2 className="font-headline text-xl font-extrabold text-slate-900 mb-5 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-slate-400" aria-hidden="true" />
        Comments{loaded && comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {loaded && comments.length === 0 && (
        <p className="text-[14px] text-slate-400 mb-6">No comments yet. Be the first to share your thoughts.</p>
      )}

      {comments.length > 0 && (
        <ul className="space-y-5 mb-8">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-slate-100 pb-5 last:border-0">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-[13.5px] font-bold text-slate-900">{c.authorName}</span>
                <span className="text-[11.5px] text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {status === 'submitted' ? (
        <p className="text-[14px] font-semibold text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
          Thanks — your comment has been submitted and is awaiting moderation.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-md border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
            />
            <input
              type="email"
              placeholder="Your email (not published)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
            />
          </div>
          <textarea
            placeholder="Add a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            maxLength={3000}
            className="w-full rounded-md border border-slate-200 px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 resize-y"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-[13.5px] font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Post Comment'}
            </button>
            {status === 'error' && <span className="text-[13px] text-red-600">Could not submit — please try again.</span>}
          </div>
        </form>
      )}
    </section>
  );
}
