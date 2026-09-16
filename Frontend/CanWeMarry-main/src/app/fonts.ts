import { Source_Serif_4, Inter } from 'next/font/google';

// A serif for headings and a plain sans for everything else. The pairing is chosen to
// read like a public institution or a legal-aid organisation rather than a consumer app —
// the tone this product needs is serious and settled, not energetic.
export const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-display',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: true,
  variable: '--font-text',
});
