import { describe, it, expect } from 'vitest';
import { findLocateRange, lineAtOffset } from './locate';

describe('findLocateRange', () => {
  it('finds a case-insensitive match', () => {
    const range = findLocateRange('An Emergency Fund protects you.', 'emergency fund');
    expect(range).toEqual({ start: 3, end: 17 });
  });

  it('returns null when the phrase is not present', () => {
    expect(findLocateRange('Some unrelated text.', 'emergency fund')).toBeNull();
  });

  it('returns null for empty haystack or needle', () => {
    expect(findLocateRange('', 'x')).toBeNull();
    expect(findLocateRange('x', '')).toBeNull();
  });

  it('only matches on the first 60 characters of a long issue message', () => {
    const longNeedle = 'a'.repeat(60) + 'THIS PART IS IGNORED';
    const haystack = 'prefix ' + 'a'.repeat(60) + ' suffix';
    const range = findLocateRange(haystack, longNeedle);
    expect(range).not.toBeNull();
    expect(range!.end - range!.start).toBe(60);
  });
});

describe('lineAtOffset', () => {
  it('returns 0 for an offset on the first line', () => {
    expect(lineAtOffset('hello world', 3)).toBe(0);
  });

  it('counts newlines before the offset', () => {
    expect(lineAtOffset('line one\nline two\nline three', 20)).toBe(2);
  });
});
