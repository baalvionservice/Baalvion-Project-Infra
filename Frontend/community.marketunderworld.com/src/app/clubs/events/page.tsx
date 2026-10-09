import { Metadata } from "next";
import { CelebrityEventsClient } from "./events-client";

const TITLE = "Celebrity Appearances & DJ Events at Indian Nightclubs 2026 | Book & Bid Tickets | Baalvion";
const DESC =
  "Book VIP tickets or bid for premium front-row seats at exclusive celebrity appearances and DJ nights across top nightclubs in Mumbai, Delhi, Bangalore, Pune and Goa. Live auction — top bidders win premium seats.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: [
    "celebrity nightclub India",
    "DJ night India 2026",
    "book VIP tickets nightclub India",
    "celebrity appearance Mumbai pub",
    "DJ event Bangalore club",
    "nightclub auction India",
    "premium seat bid nightclub",
    "celebrity event Delhi club",
    "Goa nightclub events 2026",
    "live music India nightlife",
    "nightclub event Pune",
    "baalvion events",
    "exclusive nightlife events India",
  ],
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: "https://community.marketunderworld.com/clubs/events",
    siteName: "Baalvion",
    images: [
      {
        url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format",
        width: 1200,
        height: 630,
        alt: "Celebrity & DJ Events at Indian Nightclubs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format"],
  },
  alternates: {
    canonical: "/clubs/events",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function EventsJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESC,
    url: "https://community.marketunderworld.com/clubs/events",
    isPartOf: {
      "@type": "WebSite",
      name: "Baalvion",
      url: "https://community.marketunderworld.com",
    },
    about: {
      "@type": "EntertainmentBusiness",
      name: "Nightclub Events India",
      description: "Celebrity appearances and DJ performances at premium nightclubs across India",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://community.marketunderworld.com" },
        { "@type": "ListItem", position: 2, name: "Clubs", item: "https://community.marketunderworld.com/clubs" },
        { "@type": "ListItem", position: 3, name: "Events", item: "https://community.marketunderworld.com/clubs/events" },
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

export default function CelebrityEventsPage() {
  return (
    <>
      <EventsJsonLd />
      <CelebrityEventsClient />
    </>
  );
}
