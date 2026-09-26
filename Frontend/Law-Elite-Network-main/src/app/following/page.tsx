"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MemberArticleList } from '@/components/member/MemberArticleList';
import { useMember } from '@/components/member/FollowButton';
import { deleteAllMemberData, toggleFollow } from '@/lib/member-store';

interface Described { entityType: string; slug: string; name: string; kind: string; url: string }

export default function FollowingPage() {
  return (
    <ProtectedRoute>
      <FollowingContent />
    </ProtectedRoute>
  );
}

function FollowingContent() {
  const { loaded, follows } = useMember();
  const [items, setItems] = useState<any[]>([]);
  const [entities, setEntities] = useState<Described[]>([]);
  const [fetching, setFetching] = useState(false);

  const query = useMemo(() => follows.map((f) => `${f.entityType}:${f.slug}`).join(','), [follows]);

  useEffect(() => {
    if (!loaded) return;
    if (!query) {
      setItems([]);
      setEntities([]);
      return;
    }
    let cancelled = false;
    setFetching(true);
    fetch(`/api/member/feed?e=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setItems((j.items || []).map((i: any) => i.article));
        setEntities(j.entities || []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setFetching(false));
    return () => { cancelled = true; };
  }, [loaded, query]);

  async function clearAll() {
    if (window.confirm('Remove everything you follow and every saved article? This cannot be undone.')) {
      await deleteAllMemberData().catch(() => {});
    }
  }

  return (
    <main className="min-h-screen bg-white pt-[80px] lg:pt-[120px] pb-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440]">Your feed</h1>
        <p className="mt-3 text-slate-500 max-w-2xl">
          Stories that name the people, topics, films, teams and cases you follow. Only you can see this list.
        </p>

        {loaded && follows.length === 0 && (
          <div className="mt-10 border border-slate-200 p-8 text-slate-600">
            You are not following anything yet. Use the Follow button on any{' '}
            <Link href="/people" className="font-bold underline">person</Link>,{' '}
            <Link href="/topics" className="font-bold underline">topic</Link>,{' '}
            <Link href="/entertainment" className="font-bold underline">film or show</Link>,{' '}
            <Link href="/sports" className="font-bold underline">team</Link> or{' '}
            <Link href="/legal/cases" className="font-bold underline">case</Link> to build your feed.
          </div>
        )}

        {entities.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2.5" aria-label="Things you follow">
            {entities.map((e) => (
              <li key={`${e.entityType}:${e.slug}`} className="inline-flex items-center border border-slate-300">
                <Link href={e.url} className="px-3 py-1.5 text-[13px] font-bold text-slate-800 hover:text-news-600">
                  {e.name} <span className="ml-1 text-[11px] font-semibold text-slate-400">{e.kind}</span>
                </Link>
                <button
                  type="button"
                  aria-label={`Unfollow ${e.name}`}
                  onClick={() => toggleFollow({ entityType: e.entityType as any, slug: e.slug }, false).catch(() => {})}
                  className="px-2 self-stretch border-l border-slate-200 text-slate-400 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {follows.length > 0 && !fetching && items.length === 0 && (
          <p className="mt-10 text-slate-500">
            Nothing published yet about what you follow. New stories show up here, and in your notifications, as they are published.
          </p>
        )}
        {items.length > 0 && (
          <div className="mt-10">
            <MemberArticleList articles={items} />
          </div>
        )}

        <div className="mt-16 pt-6 border-t border-slate-100 flex flex-wrap gap-6 text-[13px]">
          <Link href="/saved" className="font-bold text-slate-700 hover:text-news-600">Saved articles</Link>
          <Link href="/notifications" className="font-bold text-slate-700 hover:text-news-600">Notifications</Link>
          <button type="button" onClick={clearAll} className="font-bold text-slate-400 hover:text-red-600">
            Delete my follows and saved articles
          </button>
        </div>
      </div>
    </main>
  );
}
