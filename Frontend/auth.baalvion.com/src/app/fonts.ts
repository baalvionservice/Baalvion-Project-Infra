import {
  Inter,
  Fraunces,
  Inter_Tight,
  IBM_Plex_Mono,
  Cormorant_Garamond,
  Space_Grotesk,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from 'next/font/google';

// Every typeface used by any Baalvion brand is declared once and exposed as a CSS variable. A theme
// picks which variable drives --font-display / --font-body / --font-mono, so the shared auth surface
// renders in each site's actual typography. next/font self-hosts + subsets each family, and the
// browser only downloads the family the ACTIVE theme references — unused brands cost nothing.

export const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter-tight',
});

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-plex-mono',
});

// Distinctive brand display faces.
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-cormorant',
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

/** Apply on <body> so any theme can reference any family. */
export const fontVariables = [
  inter.variable,
  fraunces.variable,
  interTight.variable,
  plexMono.variable,
  cormorant.variable,
  spaceGrotesk.variable,
  jakarta.variable,
  jetbrainsMono.variable,
].join(' ');
