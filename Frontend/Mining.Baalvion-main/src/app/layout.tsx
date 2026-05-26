
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mining.baalvion.com'),
  title: {
    default: 'Baalvion Mining Inc. | Global Mining & Commodity Supply Network',
    template: '%s | Baalvion Mining Inc.'
  },
  description: 'The premier secure marketplace for bulk mineral trade and AI-powered compliance by Baalvion Mining Inc. Connect with verified producers and industrial buyers worldwide.',
  keywords: ['Baalvion', 'mineral trading', 'B2B mining', 'iron ore export', 'lithium supply chain', 'mining compliance', 'industrial minerals', 'commodity supply network'],
  authors: [{ name: 'Baalvion Mining Inc. Team' }],
  creator: 'Baalvion Mining Inc.',
  publisher: 'Baalvion Industries Private Limited',
  verification: {
    google: 'google-site-verification-placeholder',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mining.baalvion.com',
    siteName: 'Baalvion Mining Inc.',
    title: 'Baalvion Mining Inc. | Global Mining & Commodity Supply Network',
    description: 'Empowering the world\'s mineral trade with security, transparency, and innovation.',
    images: [{
      url: 'https://picsum.photos/seed/baalvion-og/1200/630',
      width: 1200,
      height: 630,
      alt: 'Baalvion Mining Inc. Global Operations'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baalvion Mining Inc. | Global B2B Mineral Trading',
    description: 'Secure, transparent, and AI-powered mineral trade for global industries.',
    images: ['https://picsum.photos/seed/baalvion-twitter/1200/630'],
    creator: '@baalvion',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Baalvion Mining Inc.",
    "url": "https://mining.baalvion.com",
    "logo": "https://mining.baalvion.com/logo.png",
    "description": "Global Mining & Commodity Supply Network operated by Baalvion Industries Private Limited.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mumbai",
      "addressRegion": "Maharashtra",
      "postalCode": "400026",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 89512 84770",
      "contactType": "customer service"
    }
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="google-site-verification" content="NAuMkSOIsTlKlp4DUrjI22woZL6FdoxEFwxoJHh5BYY" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <GoogleAnalytics />
        {children}
        <CookieConsent />
        <Toaster />
      </body>
    </html>
  );
}
