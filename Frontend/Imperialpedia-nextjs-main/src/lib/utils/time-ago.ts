/** Short relative time for news UI ("3m ago", "2h ago", "5d ago"). */
export function timeAgo(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "recently";
  const diffMin = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.round(diffMin / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
