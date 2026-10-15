import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { SubmissionsProvider } from '@/contexts/submissions-context';
import { getSiteUrl } from '@/lib/site-url';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { CIN, LEGAL_ENTITY_NAME } from '@baalvion/company';

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
    default: 'NEW AI Skills Team — Hire by Skill, Not by Resume',
    template: '%s | NEW AI Skills Team',
  },
  description:
    'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance — not paper.',
  keywords: [
    'skill-based hiring',
    'proof of skill',
    'verified talent',
    'technical assessment',
    'candidate evaluation',
    'skill verification',
    'hiring platform',
    'real-world performance',
    'NEW AI Skills Team',
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    siteName: 'NEW AI Skills Team',
    title: 'NEW AI Skills Team — Hire by Skill, Not by Resume',
    description:
      'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance — not paper.',
    url: siteUrl,
    // og:image is provided automatically by the file-convention
    // `src/app/opengraph-image.tsx` (resolved against metadataBase).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEW AI Skills Team — Hire by Skill, Not by Resume',
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
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'NEW AI Skills Team',
      legalName: LEGAL_ENTITY_NAME,
      identifier: { '@type': 'PropertyValue', name: 'CIN', value: CIN },
      url: siteUrl,
      description:
        'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance.',
      logo: `${siteUrl}/opengraph-image`,
      sameAs: [siteUrl],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'NEW AI Skills Team',
      url: siteUrl,
      description:
        'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance.',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <GoogleAnalytics />
      </head>
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
