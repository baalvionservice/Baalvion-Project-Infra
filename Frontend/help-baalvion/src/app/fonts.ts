import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google';

// DISPLAY — headings, nav section labels.
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-display',
});

// TEXT — body copy, UI chrome.
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: true,
  variable: '--font-text',
});

// CODE — code blocks, inline code, API paths.
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
  variable: '--font-mono',
});
