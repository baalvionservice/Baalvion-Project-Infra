import { useSyncExternalStore } from 'react';
import { apiClient } from '@/lib/api/client';
import type { EntityType } from '@/types/entity-tagging';

/**
 * Client-side mirror of the signed-in member's follows and saved articles
 * (law-service /v1/member). One shared store so a page with many Follow
 * buttons makes one request, and every button updates together. The server
 * is the source of truth: each toggle is optimistic and rolls back on failure.
 */
export interface FollowRef {
  entityType: EntityType;
  slug: string;
}

interface State {
  ownerId: string | null;
  loaded: boolean;
  follows: FollowRef[];
  saved: string[];
}

let state: State = { ownerId: null, loaded: false, follows: [], saved: [] };
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? [];

/** Loads once per signed-in user; a different user (or sign-out) resets the store. */
export function loadMember(userId: string | null): Promise<void> {
  if (!userId) {
    if (state.ownerId !== null || state.loaded) set({ ownerId: null, loaded: false, follows: [], saved: [] });
    return Promise.resolve();
  }
  if (state.ownerId === userId && (state.loaded || loading)) return loading ?? Promise.resolve();
  set({ ownerId: userId, loaded: false, follows: [], saved: [] });
  loading = Promise.all([apiClient.get('/member/follows'), apiClient.get('/member/saved')])
    .then(([f, s]) => {
      if (state.ownerId !== userId) return;
      set({
        loaded: true,
        follows: unwrap(f).map((r: any) => ({ entityType: r.entity_type, slug: r.entity_slug })),
        saved: unwrap(s).map((r: any) => r.article_slug),
      });
    })
    .catch(() => set({ loaded: true }))
    .finally(() => { loading = null; });
  return loading;
}

export function useMemberState(): State {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => state,
    () => state,
  );
}

const same = (a: FollowRef, b: FollowRef) => a.entityType === b.entityType && a.slug === b.slug;

export async function toggleFollow(ref: FollowRef, on: boolean): Promise<void> {
  const before = state.follows;
  set({ follows: on ? [...before.filter((f) => !same(f, ref)), ref] : before.filter((f) => !same(f, ref)) });
  try {
    if (on) await apiClient.post('/member/follows', { entityType: ref.entityType, slug: ref.slug });
    else await apiClient.delete(`/member/follows/${ref.entityType}/${ref.slug}`);
  } catch (e) {
    set({ follows: before });
    throw e;
  }
}

export async function toggleSaved(slug: string, on: boolean): Promise<void> {
  const before = state.saved;
  set({ saved: on ? [slug, ...before.filter((s) => s !== slug)] : before.filter((s) => s !== slug) });
  try {
    if (on) await apiClient.post('/member/saved', { slug });
    else await apiClient.delete(`/member/saved/${slug}`);
  } catch (e) {
    set({ saved: before });
    throw e;
  }
}

export async function deleteAllMemberData(): Promise<void> {
  await apiClient.delete('/member/data');
  set({ follows: [], saved: [] });
}
