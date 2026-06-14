import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/app/providers/AppProvider';
import { AppConfig } from '@/config/app.config';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(AppConfig.baseUrl),
  icons: { icon: 'data:,' },
  title: {
    default: 'TalentOS by Baalvion | The OS for Modern Recruitment',
    template: '%s | TalentOS by Baalvion',
  },
  description:
    'TalentOS is an intelligent, global talent acquisition platform designed to connect exceptional talent with borderless opportunity.',
  openGraph: {
    title: 'TalentOS by Baalvion',
    description: 'The Operating System for Modern Recruitment.',
    type: 'website',
    url: AppConfig.baseUrl,
    siteName: 'TalentOS by Baalvion',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TalentOS by Baalvion' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@baalvion',
    title: 'TalentOS by Baalvion',
    description: 'The Operating System for Modern Recruitment.',
    images: [`/og-image.png`],
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

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Baalvion Industries Pvt Ltd',
  url: AppConfig.baseUrl,
  logo: `${AppConfig.baseUrl}/logo.png`,
  sameAs: [
    'https://www.baalvion.com',
  ],
};

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TalentOS by Baalvion',
  url: AppConfig.baseUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${AppConfig.baseUrl}/careers/open-positions?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      </head>
      <body className='font-sans antialiased'>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
