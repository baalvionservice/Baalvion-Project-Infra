// ─── Helpers ────────────────────────────────────────────────────────────────

// timeZone is pinned to UTC by default (not the runtime's local zone): this
// renders server-side (Node, effectively UTC) and is read again on hydration
// (the visitor's own browser timezone). For a publishedAt timestamp near a
// local midnight boundary, an unpinned zone can compute a different calendar
// day on each side — e.g. 23:30 UTC reads as "Aug 16" on the server but
// "Aug 17" in a UTC+5:30 browser — producing a text-only hydration mismatch
// (React error #418) on every article card that renders a formatted date.
// Pinning to UTC makes the two renders agree; pass opts.timeZone to override.
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
      ...opts,
    });
  }