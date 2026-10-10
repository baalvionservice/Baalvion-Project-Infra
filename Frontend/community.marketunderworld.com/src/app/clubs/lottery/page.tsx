import { Metadata } from "next";
import { LotteryClient } from "./lottery-client";

const TITLE = "Monthly VIP Club Ticket Lottery India | Win Free Nightclub Entry | Baalvion";
const DESC =
  "Enter our monthly lottery for a chance to win 1 of 1000 free exclusive VIP club tickets across top nightclubs in Mumbai, Pune, Delhi, Bangalore and Goa. Just ₹499 per entry. Verified draws every month.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: [
    "nightclub ticket lottery India",
    "free VIP club ticket India",
    "win nightclub entry India",
    "Mumbai club lottery",
    "Pune nightclub contest",
    "Delhi club giveaway",
    "Bangalore nightlife lottery",
    "Goa club ticket lucky draw",
    "baalvion lottery",
    "VIP ticket lucky draw India",
    "nightlife contest India 2026",
    "free pub entry Mumbai",
  ],
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: "https://community.marketunderworld.com/clubs/lottery",
    siteName: "Baalvion",
    images: [
      {
        url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format",
        width: 1200,
        height: 630,
        alt: "Monthly VIP Club Ticket Lottery India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format"],
  },
  alternates: {
    canonical: "/clubs/lottery",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function LotteryJsonLd() {
  const nextDraw = new Date();
  nextDraw.setMonth(nextDraw.getMonth() + 1);
  nextDraw.setDate(1); // 1st of next month

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Baalvion Monthly VIP Nightclub Ticket Lottery",
    description: DESC,
    startDate: nextDraw.toISOString().split("T")[0],
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: "https://community.marketunderworld.com/clubs/lottery",
    },
    organizer: {
      "@type": "Organization",
      name: "Baalvion",
      url: "https://community.marketunderworld.com",
    },
    offers: {
      "@type": "Offer",
      name: "Lottery Entry",
      price: "499",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: "https://community.marketunderworld.com/clubs/lottery",
    },
    prize: "1 of 1000 Free VIP Nightclub Entry Tickets",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://community.marketunderworld.com" },
        { "@type": "ListItem", position: 2, name: "Clubs", item: "https://community.marketunderworld.com/clubs" },
        { "@type": "ListItem", position: 3, name: "Lottery", item: "https://community.marketunderworld.com/clubs/lottery" },
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

export default function LotteryPage() {
  return (
    <>
      <LotteryJsonLd />
      <LotteryClient />
    </>
  );
}
