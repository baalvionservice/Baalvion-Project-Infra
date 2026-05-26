// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      ...opts,
    });
  }