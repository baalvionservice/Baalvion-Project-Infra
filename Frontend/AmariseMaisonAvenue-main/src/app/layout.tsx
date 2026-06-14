import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/store";
import {
  normalizeCountry,
  countryToLocale,
  directionForCountry,
} from "@/lib/i18n/countries";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

// Elegant high-contrast luxury serif for all headings (replaces the never-loaded "Ivy Ora").
// Self-hosted by next/font — no external request, no CSP/ORB issue.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.amarisemaisonavenue.com/"),
  icons: { icon: '/favicon.svg' },
  title: {
    default: "AMARISÉ MAISON AVENUE | The Pinnacle of Global Luxury",
    template: "%s | AMARISÉ MAISON AVENUE",
  },
  description:
    "Curating the world's most exquisite treasures since 1924. Explore exclusive collections in haute couture, high-end watches, and fine jewelry.",
  keywords: [
    "luxury fashion",
    "bespoke jewelry",
    "high-end watches",
    "heritage couture",
    "private acquisition",
  ],
  authors: [{ name: "Amarisé Maison Avenue" }],
  creator: "Amarisé Maison Avenue",
  publisher: "Amarisé Maison Avenue",
  openGraph: {
    title: "AMARISÉ MAISON AVENUE | The Pinnacle of Global Luxury",
    description: "Curating the world's most exquisite treasures since 1924.",
    url: "https://www.amarisemaisonavenue.com/",
    siteName: "Amarisé Maison Avenue",
    type: "website",
    images: [
      {
        url: "https://picsum.photos/seed/amarise-og/1200/630",
        width: 1200,
        height: 630,
        alt: "AMARISÉ MAISON AVENUE Global Flagship",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AMARISÉ MAISON AVENUE | Global Luxury",
    description: "The Absolute Standard of Heritage Curation.",
    images: ["https://picsum.photos/seed/amarise-twitter/1200/600"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Country is resolved in middleware and forwarded via `x-amarise-country`,
  // so the SSR HTML carries the correct lang + direction (e.g. ar/RTL for AE).
  const country = normalizeCountry((await headers()).get("x-amarise-country"));
  const htmlLang = countryToLocale(country);
  const htmlDir = directionForCountry(country);

  return (
    <html
      lang={htmlLang}
      dir={htmlDir}
      className={`${inter.variable} ${cormorant.variable} light scroll-smooth`}
    >
      <head>
        <link rel="preconnect" href="https://picsum.photos" />
        <link rel="preconnect" href="https://madisonavenuecouture.com" />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden selection:bg-gold selection:text-white">
        <AppProvider>{children}</AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
