import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { SubmissionsProvider } from '@/contexts/submissions-context';

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
  metadataBase: new URL('https://controlthemarket.com'),
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
    url: 'https://controlthemarket.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ControlTheMarket — Proof-of-Skill Hiring Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ControlTheMarket — Hire by Skill, Not by Resume',
    description:
      'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance — not paper.',
    images: ['/og-image.png'],
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
  url: 'https://controlthemarket.com',
  description:
    'The proof-of-skill hiring platform where top companies discover verified talent based on real-world performance.',
  sameAs: ['https://controlthemarket.com'],
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
