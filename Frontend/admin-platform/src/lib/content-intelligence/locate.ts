// Pure helper behind ArticleForm's "click an issue → jump to it in the editor" behavior
// (Content Intelligence panel spec §19). Kept separate from the component so it's testable
// without a DOM harness — this codebase's vitest config runs in a node environment only.

const MAX_NEEDLE_LEN = 60;

export interface LocateRange { start: number; end: number }

/**
 * Finds where `needle` (an issue message, phrase, or excerpt) occurs in `haystack` (the
 * article content), case-insensitively. Only the first MAX_NEEDLE_LEN characters of the
 * needle are matched, since issue messages are often longer than the literal text they refer
 * to. Returns null when nothing matches — callers should no-op rather than guess.
 */
export function findLocateRange(haystack: string, needle: string): LocateRange | null {
  if (!haystack || !needle) return null;
  const clipped = needle.slice(0, MAX_NEEDLE_LEN);
  const idx = haystack.toLowerCase().indexOf(clipped.toLowerCase());
  if (idx === -1) return null;
  return { start: idx, end: idx + clipped.length };
}

/** Line number (0-based) containing a given character offset, for scrolling a textarea to it. */
export function lineAtOffset(haystack: string, offset: number): number {
  return haystack.slice(0, offset).split('\n').length - 1;
}
