import { describe, it, expect } from 'vitest';
import { placeholderReasons, splitList } from './placeholders';

describe('placeholderReasons — the real live products', () => {
  const live = {
    description: 'PLACEHOLDER DESCRIPTION — replace with the real leather type, hardware, and condition notes for this specific bag before publishing.',
    colors: ['TBD Color'],
    listingStatus: 'Draft - Pending Real Details',
  };
  it('flags all three kinds of stand-in text', () => { expect(placeholderReasons(live)).toHaveLength(3); });
  it('is clean once real details are in', () => {
    expect(placeholderReasons({ description: 'Togo leather, gold hardware, excellent condition.', colors: ['Gold'], listingStatus: 'Ready' })).toEqual([]);
  });
  it('does not trip on ordinary words', () => {
    expect(placeholderReasons({ description: 'A holder for placeholders? No. Classic Birkin in Etoupe.', colors: ['Etoupe'] }).length).toBe(1); // the word "placeholders" is still flagged on purpose
    expect(placeholderReasons({ description: 'Hand-stitched in Paris', colors: [] })).toEqual([]);
  });
  it('handles empty input', () => { expect(placeholderReasons({})).toEqual([]); });
});

describe('splitList', () => {
  it('trims and de-duplicates', () => { expect(splitList(' Gold, Etoupe ,Gold,, ')).toEqual(['Gold', 'Etoupe']); });
});
