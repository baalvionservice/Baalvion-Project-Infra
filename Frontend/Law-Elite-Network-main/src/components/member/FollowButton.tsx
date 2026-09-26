"use client";

import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loadMember, toggleFollow, toggleSaved, useMemberState } from '@/lib/member-store';
import { sharedSignInUrl } from '@/lib/shared-auth';
import { cn } from '@/lib/utils';
import type { EntityType } from '@/types/entity-tagging';

/** Loads the member's lists once the auth context knows who is signed in. */
function useMember() {
  const { user, loading } = useAuth();
  const member = useMemberState();
  const userId = user?.userId ?? null;
  useEffect(() => {
    if (!loading) void loadMember(userId);
  }, [loading, userId]);
  return { signedIn: !!userId, ...member };
}

const base =
  'inline-flex items-center gap-2 h-9 px-4 text-[12px] font-bold uppercase tracking-wider border transition-colors disabled:opacity-60';

export function FollowButton({ entityType, slug, className }: { entityType: EntityType; slug: string; className?: string }) {
  const { signedIn, loaded, follows } = useMember();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const following = follows.some((f) => f.entityType === entityType && f.slug === slug);

  async function onClick() {
    if (!signedIn) {
      window.location.assign(sharedSignInUrl());
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await toggleFollow({ entityType, slug }, !following);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || (signedIn && !loaded)}
      aria-pressed={following}
      title={failed ? 'Could not update. Try again.' : signedIn ? undefined : 'Sign in to follow'}
      className={cn(
        base,
        following ? 'bg-[#0F2440] border-[#0F2440] text-white' : 'border-slate-300 text-slate-900 hover:border-slate-900',
        failed && 'border-red-500',
        className,
      )}
    >
      {following ? <BellRing className="w-3.5 h-3.5" aria-hidden="true" /> : <Bell className="w-3.5 h-3.5" aria-hidden="true" />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}

export function SaveArticleButton({ slug, className }: { slug: string; className?: string }) {
  const { signedIn, loaded, saved } = useMember();
  const [busy, setBusy] = useState(false);
  const isSaved = saved.includes(slug);

  async function onClick() {
    if (!signedIn) {
      window.location.assign(sharedSignInUrl());
      return;
    }
    setBusy(true);
    try {
      await toggleSaved(slug, !isSaved);
    } catch {
      /* store already rolled back */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || (signedIn && !loaded)}
      aria-pressed={isSaved}
      className={cn(base, isSaved ? 'border-[#0F2440] text-[#0F2440]' : 'border-slate-300 text-slate-900 hover:border-slate-900', className)}
    >
      {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" /> : <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />}
      {isSaved ? 'Saved' : 'Save'}
    </button>
  );
}

export { useMember };
