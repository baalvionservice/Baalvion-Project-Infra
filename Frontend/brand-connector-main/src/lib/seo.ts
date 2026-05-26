import type { Metadata } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://connect.baalvion.com";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * Reusable helper to generate consistent metadata across pages
 */
export function generateMetadata({
  title = "Baalvion Connect | AI-Powered Brand & Creator Marketplace",
  description = "Connect with the world's top creators using our AI matching engine. Scale your brand with data-driven influencer marketing and secure escrow payments.",
  path = "",
  ogImage = "/og-image.jpg",
  noIndex = false,
}: SEOProps = {}): Metadata {
  const url = `${BASE_URL}${path}`;
  const fullTitle = title.includes("Baalvion")
    ? title
    : `${title} | Baalvion Connect`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "Baalvion Connect",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Baalvion Connect Marketplace",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
      creator: "@baalvion",
    },
    icons: {
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}
