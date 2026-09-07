import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { sourceSerif, inter } from '@/app/fonts';
import { THEME_SCRIPT } from '@/lib/theme-script';
import { SITE } from '@/lib/site';
import { Navigation } from '@/components/site/navigation';
import { VerificationNotice } from '@/components/site/verification-notice';
import { Footer } from '@/components/site/footer';
import { MobileNav } from '@/components/site/mobile-nav';
import { ToastProvider } from '@/components/ui';
import { IdentityProvider } from '@/lib/auth/identity-context';
import { identity as identityApi, me } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: '/manifest.webmanifest',
  // Closed by default. The handful of pages the PLATFORM wrote opt in individually via
  // `publicMetadata()`; anything a member wrote inherits this and stays out of the index.
  // A case its author made public is visible to people who come to the site — it is not a
  // result in a search for their name by the family the case is about.
  robots: { index: false, follow: false },
  openGraph: { title: SITE.name, description: SITE.description, url: SITE.url, siteName: SITE.name, type: 'website' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the page paint into the display cutout area; the bottom bar reserves the safe-area
  // inset itself so it stays fully tappable above the home indicator.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#12181d' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Resolved once per render, on the server, where the session cookies are readable.
  // serverOptions() routes an anonymous visitor straight to the service (which answers
  // authenticated: false) and a signed-in one through the gateway.
  const options = await serverOptions();
  const meResult = await identityApi.me(options);
  const initialIdentity = meResult.ok && meResult.data.authenticated ? meResult.data : null;

  // Fetched here so both navigations share one request instead of each polling for it.
  const unreadResult = initialIdentity ? await me.unreadCount(options) : null;
  const unread = unreadResult?.ok ? unreadResult.data.unread : 0;

  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <IdentityProvider initial={initialIdentity}>
          <ToastProvider>
            <Navigation initialUnread={unread} />
            <VerificationNotice />
            {/* pb-14 on small screens keeps the last of the page clear of the bottom bar. */}
            <main id="main" className="flex-1 pb-14 xl:pb-0">{children}</main>
            <Footer />
            <MobileNav unread={unread} />
          </ToastProvider>
        </IdentityProvider>
      </body>
    </html>
  );
}
