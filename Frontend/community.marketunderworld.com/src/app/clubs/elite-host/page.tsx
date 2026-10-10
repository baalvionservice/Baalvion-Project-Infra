import { Metadata } from "next";
import { EliteHostClient } from "./elite-host-client";

const TITLE = "Elite Host Program — Invite Ladies to VIP Club Night | Baalvion";
const DESC =
  "India's first verified High-Net-Worth Individual party hosting platform. Sponsor an exclusive nightclub event — VIP table, premium cab service, food & drinks covered. Browse and apply for elite party invitations across Mumbai, Pune, Delhi, Bangalore and Goa.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: [
    "elite host India",
    "VIP party host Mumbai",
    "sponsor nightclub party India",
    "luxury club host invite",
    "elite party invite Mumbai",
    "HNWI nightlife India",
    "VIP table booking India",
    "exclusive nightclub event India",
    "invite ladies pub India",
    "premium party host Pune",
    "baalvion elite host",
    "nightlife host program India",
  ],
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: "https://community.marketunderworld.com/clubs/elite-host",
    siteName: "Baalvion",
    images: [
      {
        url: "https://images.unsplash.com/photo-1574365561657-3f820253f545?q=80&w=1200&auto=format",
        width: 1200,
        height: 630,
        alt: "Elite Host Program — VIP Nightlife India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["https://images.unsplash.com/photo-1574365561657-3f820253f545?q=80&w=1200&auto=format"],
  },
  alternates: {
    canonical: "/clubs/elite-host",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for the Elite Host service
function EliteHostJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Elite Host Program",
    description: DESC,
    provider: {
      "@type": "Organization",
      name: "Baalvion",
      url: "https://community.marketunderworld.com",
    },
    areaServed: [
      { "@type": "City", name: "Mumbai" },
      { "@type": "City", name: "Pune" },
      { "@type": "City", name: "Delhi" },
      { "@type": "City", name: "Bangalore" },
      { "@type": "City", name: "Goa" },
      { "@type": "City", name: "Hyderabad" },
    ],
    serviceType: "VIP Nightlife Event Hosting",
    offers: {
      "@type": "Offer",
      description: "Host a VIP nightclub party with full transport, table booking, and catering for invited guests.",
      priceCurrency: "INR",
      price: "500000",
      eligibleRegion: {
        "@type": "Country",
        name: "India",
      },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Minimum Budget", value: "₹5,00,000" },
      { "@type": "PropertyValue", name: "Services Included", value: "VIP Table, Premium Cab, Food & Drinks" },
      { "@type": "PropertyValue", name: "Safety Policy", value: "Zero Tolerance — KYC Verified Hosts Only" },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function EliteHostPage() {
  return (
    <>
      <EliteHostJsonLd />
      <EliteHostClient />
    </>
  );
}
