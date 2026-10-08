import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CryptoTicker } from "@/components/layout/ticker";
import { IdentityProvider } from "@/context/identity-context";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { NotificationProvider } from "@/context/notification-context";
import { LanguageProvider } from "@/context/language-context";
import { ToastContainer } from "@/components/notifications/toast-container";
import { Toaster } from "@/components/ui/toaster";
import { GlobalSearch } from "@/components/layout/global-search";
import { GoogleAnalytics } from "@/components/layout/google-analytics";
import { ScaryTransitionProvider } from "@/components/layout/scary-transition-provider";
import { cn } from "@/lib/utils";

const isDev = process.env.NODE_ENV === 'development';

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space",
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: "#0B0C0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Hell Road",
    template: "%s | Hell Road"
  },
  description: "The world's premier secure intelligence node for global knowledge exchange and commodity trade. Verified operators only.",
  // This app deploys to community.marketunderworld.com (wrangler worker
  // `market-underworld-community`). The apex marketunderworld.com is a DIFFERENT property —
  // Baalvion Insiders, served by the Vite app — so basing absolute URLs on it pointed this
  // site's OpenGraph and canonicals at someone else's domain.
  metadataBase: new URL('https://community.marketunderworld.com'),
  // Without an explicit canonical Next emits none at all, which is why this page had no
  // canonical link and search engines were left to guess which URL is authoritative.
  alternates: { canonical: '/' },
  openGraph: {
    title: "Hell Road",
    description: "Underground community",
    type: "website",
    url: "https://community.marketunderworld.com",
    siteName: "Hell Road",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.jpg" />
        <GoogleAnalytics />
      </head>
      <body
        className={cn(
          !isDev ? `${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}` : "font-sans",
          "bg-[#0B0C0F] text-white antialiased min-h-screen flex flex-col"
        )}
        style={isDev ? { fontFamily: 'system-ui, -apple-system, sans-serif' } : {}}
      >
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <NotificationProvider>
                <IdentityProvider>
                  <ScaryTransitionProvider>
                    <header>
                      <CryptoTicker />
                    </header>
                    <main className="flex-1 flex flex-col">
                      {children}
                    </main>
                    <ToastContainer />
                    <Toaster />
                    <GlobalSearch />
                  </ScaryTransitionProvider>
                </IdentityProvider>
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
