"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { StoryCard } from '@/components/knowledge/news/StoryCard';
import { SaveArticleButton, useMember } from '@/components/member/FollowButton';

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <SavedContent />
    </ProtectedRoute>
  );
}

function SavedContent() {
  const { loaded, saved } = useMember();
  const [articles, setArticles] = useState<any[]>([]);
  const key = useMemo(() => saved.join(','), [saved]);

  useEffect(() => {
    if (!loaded || !key) {
      setArticles([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/member/articles?slugs=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        // Keep the member's own save order (newest first), not the index's.
        const bySlug = new Map((j.items || []).map((a: any) => [a.slug, a]));
        setArticles(saved.map((s) => bySlug.get(s)).filter(Boolean) as any[]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [loaded, key, saved]);

  return (
    <main className="min-h-screen bg-white pt-[80px] lg:pt-[120px] pb-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440]">Saved articles</h1>
        <p className="mt-3 text-slate-500">Only you can see what you save.</p>
        {loaded && saved.length === 0 && (
          <p className="mt-10 border border-slate-200 p-8 text-slate-600">
            Nothing saved yet. Use Save on any article to keep it here. <Link href="/" className="font-bold underline">Browse the latest news</Link>.
          </p>
        )}
        {articles.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
            {articles.map((a) => (
              <div key={a.slug} className="flex flex-col">
                <div className="flex-1">
                  <StoryCard article={a} />
                </div>
                <SaveArticleButton slug={a.slug} className="mt-3 self-start" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
