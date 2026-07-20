import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names, keeping the later conflicting Tailwind utility', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('drops falsy values', () => {
    expect(cn('base', false, undefined, null, 'extra')).toBe('base extra');
  });

  it('applies conditional classes from an object form', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });
});
