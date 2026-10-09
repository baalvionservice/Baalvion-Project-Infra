import { Metadata } from "next";
import { DjDemandClient } from "./dj-demand-client";

const TITLE = "Demand a DJ or Artist at Your Club | Public Bidding Platform India | Baalvion";
const DESC =
  "Vote for your favourite DJ or celebrity to perform at your local pub or nightclub. Pool pledges with fans — when the target is reached, we book the artist. Active demands across Mumbai, Pune, Delhi, Bangalore, Goa and more Indian cities.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: [
    "demand a DJ India",
    "book DJ at pub India",
    "crowd fund DJ night India",
    "DJ demand Mumbai",
    "artist booking India nightclub",
    "DJ booking crowd pledge",
    "book celebrity appearance pub India",
    "DJ Snake India tour",
    "KSHMR India tour",
    "Martin Garrix India",
    "Nucleya live India",
    "nightclub DJ booking India",
    "baalvion DJ demand",
    "vote for DJ India",
  ],
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: "https://community.marketunderworld.com/clubs/dj-demand",
    siteName: "Baalvion",
    images: [
      {
        url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format",
        width: 1200,
        height: 630,
        alt: "Demand a DJ — Collective Bidding Platform India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format"],
  },
  alternates: {
    canonical: "/clubs/dj-demand",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function DjDemandJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESC,
    url: "https://community.marketunderworld.com/clubs/dj-demand",
    isPartOf: {
      "@type": "WebSite",
      name: "Baalvion",
      url: "https://community.marketunderworld.com",
    },
    about: {
      "@type": "Service",
      name: "DJ Demand & Collective Bidding",
      description: "A platform where nightlife fans collectively pledge money to bring their favourite DJs and artists to local clubs and pubs across India.",
      serviceType: "Entertainment Booking",
      areaServed: { "@type": "Country", name: "India" },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://community.marketunderworld.com" },
        { "@type": "ListItem", position: 2, name: "Clubs", item: "https://community.marketunderworld.com/clubs" },
        { "@type": "ListItem", position: 3, name: "Demand a DJ", item: "https://community.marketunderworld.com/clubs/dj-demand" },
      ],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function DjDemandPage() {
  return (
    <>
      <DjDemandJsonLd />
      <DjDemandClient />
    </>
  );
}
