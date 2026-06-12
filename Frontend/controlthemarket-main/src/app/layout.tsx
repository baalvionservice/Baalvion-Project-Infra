import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { SubmissionsProvider } from '@/contexts/submissions-context';
import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: { icon: 'data:,' },
  title: {
    default: 'ControlTheMarket — Hire by Skill, Not by Resume',
    template: '%s | ControlTheMarket',
  },
  description:
    'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance — not paper.',
  openGraph: {
    type: 'website',
    siteName: 'ControlTheMarket',
    title: 'ControlTheMarket — Hire by Skill, Not by Resume',
    description:
      'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance — not paper.',
    url: siteUrl,
    // og:image is provided automatically by the file-convention
    // `src/app/opengraph-image.tsx` (resolved against metadataBase).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ControlTheMarket — Hire by Skill, Not by Resume',
    description:
      'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance — not paper.',
    // twitter:image is provided automatically by the file-convention OG image.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ControlTheMarket',
  url: siteUrl,
  description:
    'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance.',
  sameAs: [siteUrl],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <SubmissionsProvider>
              {children}
              <Toaster />
          </SubmissionsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
