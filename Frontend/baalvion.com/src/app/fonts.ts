import { Fraunces, Inter_Tight, IBM_Plex_Mono } from 'next/font/google';

/**
 * Tri-voice type system — font maps to meaning.
 *
 *  Fraunces      — "what the institution SAYS"   (hero, running heads, closing)
 *  Inter Tight   — "how it OPERATES"             (body, nav, labels, index rows)
 *  IBM Plex Mono — "what it RECORDS"             (folios, figures, datelines, IDs)
 */

// DISPLAY — high-contrast serif. Variable opsz keeps thin strokes hair-fine at scale.
export const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  preload: true,
  variable: '--font-display',
});

// TEXT / STRUCTURE — the operations voice.
export const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
  variable: '--font-text',
});

// RECORD — the ledger voice. Uppercase, tabular figures.
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
  variable: '--font-mono',
});
