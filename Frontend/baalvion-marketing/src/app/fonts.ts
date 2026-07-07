import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google';

// DISPLAY — geometric, confident. Headlines, hero statements, section titles.
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-display',
});

// TEXT — body copy, nav, UI chrome.
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: true,
  variable: '--font-text',
});

// DATA — stats, labels, badges, code-like accents.
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
  variable: '--font-mono',
});
