export function secondsSince(iso: string | undefined, nowMs: number): number | null {
  if (!iso) return null;
  return Math.max(0, Math.round((nowMs - Date.parse(iso)) / 1000));
}

export function formatAgo(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
