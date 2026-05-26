import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/store";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.amarisemaisonavenue.com/"),
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} light scroll-smooth`}>
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
