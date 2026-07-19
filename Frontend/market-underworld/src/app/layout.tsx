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
import { GlobalSearch } from "@/components/layout/global-search";
import { GoogleAnalytics } from "@/components/layout/google-analytics";
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
    default: "Market Underworld | Elite Global Trade Network",
    template: "%s | Market Underworld"
  },
  description: "The world's premier secure intelligence node for global knowledge exchange and commodity trade. Verified operators only.",
  metadataBase: new URL('https://marketunderworld.com'),
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "Market Underworld",
    description: "Secure Trade & Intelligence Node",
    type: "website",
    url: "https://marketunderworld.com",
    siteName: "Market Underworld",
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
                  <header>
                    <CryptoTicker />
                  </header>
                  <main className="flex-1 flex flex-col">
                    {children}
                  </main>
                  <ToastContainer />
                  <GlobalSearch />
                </IdentityProvider>
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
