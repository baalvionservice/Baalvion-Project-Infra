import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  themeColor: "#050810",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Baalvion Intelligence | Real-Time Global News Intelligence",
    template: "%s | Baalvion Intelligence",
  },
  description:
    "Monitor companies, competitors, industries, and world events in real time with AI-powered summaries, trends, sentiment, and alerts. The news API built for AI agents and businesses.",
  keywords: [
    "news API",
    "news intelligence",
    "AI agent news",
    "trend detection",
    "sentiment analysis",
    "real-time alerts",
    "Baalvion Intelligence",
  ],
  authors: [{ name: "Baalvion Intelligence" }],
  metadataBase: new URL("https://signals.baalvion.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Baalvion Intelligence",
    title: "Baalvion Intelligence | Real-Time Global News Intelligence",
    description:
      "Turn global news into actionable intelligence. AI summaries, entity extraction, trend detection, and sub-60-second alerts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baalvion Intelligence | Real-Time Global News Intelligence",
    description:
      "Turn global news into actionable intelligence. AI summaries, entity extraction, trend detection, and sub-60-second alerts.",
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Baalvion Intelligence",
  url: "https://signals.baalvion.com",
  description:
    "Real-time global news intelligence infrastructure — AI summaries, entity extraction, trend detection, and sub-60-second alerts for developers and businesses.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Baalvion Intelligence",
  url: "https://signals.baalvion.com",
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Baalvion Intelligence",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
        />
      </head>
      <body
        style={{
          ["--font-display" as string]: "'Sora', sans-serif",
          ["--font-body" as string]: "'Inter', sans-serif",
          ["--font-mono" as string]: "'JetBrains Mono', monospace",
        }}
        className="font-body antialiased"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:bg-primary focus:p-4 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
