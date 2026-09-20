import type { MediaKind } from '@/lib/media-server';

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36).slice(0, 6);
};

/** Stable page slug for a clip: readable title plus a short hash of its URL, so two clips with one title never collide. */
export function mediaSlug(item: { title: string; url: string }): string {
  const words = item.title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${words || 'clip'}-${hash(item.url)}`;
}

export function mediaUrl(kind: MediaKind, slug: string): string {
  return `/${kind === 'video' ? 'videos' : 'interviews'}/${slug}`;
}

/**
 * Embeddable player URL, only for hosts we have allow-listed (and that the CSP
 * frame-src permits). Anything else returns null and the page links out
 * instead, so an arbitrary URL is never loaded in an iframe on our origin.
 */
export function embedUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.replace(/^www\./, '');
  let id: string | null = null;
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    id = u.pathname === '/watch' ? u.searchParams.get('v') : u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : null;
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'youtu.be') {
    id = u.pathname.slice(1);
    return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'vimeo.com') {
    id = u.pathname.split('/').filter(Boolean)[0] ?? '';
    return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}
