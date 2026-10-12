import { pageMetadata } from "@/lib/cms";
import { Metadata } from "next";
import { ClubsClient } from "./clubs-client";
import { getClubs } from "@/lib/api/nightlife";

const defaultMetadata: Metadata = {
  title: "Best Nightclubs in India and Dubai | Guest Lists, Pubs & Bars",
  description: "Find nightclubs, pubs and bars across Mumbai, Delhi NCR, Bangalore, Pune and Dubai. Filter by country, city, area and type. Get on the free guest list, book premium VIP bottle service, check cover charges, and explore DJ lineups for 2026.",
  keywords: [
    "best nightclubs India",
    "VIP table booking",
    "club guest list India",
    "nightlife Mumbai",
    "nightlife Delhi",
    "nightlife Dubai",
    "Dubai nightclubs",
    "club cover charge",
    "book nightclub tables",
    "top pubs 2026",
    "party places",
  ],
  openGraph: {
    title: "Best Nightclubs in India and Dubai | Guest Lists & VIP Tables",
    description: "Explore nightlife in India and the UAE. Book VIP tables or join the free guest list at premium venues.",
    type: "website",
  },
  alternates: {
    canonical: "/clubs",
  },
};

export default async function ClubsRootPage() {
  // The list shows cards, so send only what a card needs (a venue's long content loads on its own page).
  const clubs = (await getClubs()).map((c) => ({
    id: c.id, name: c.name, state: c.state, city: c.city, suburb: c.suburb, address: c.address, image: c.image,
    musicType: c.musicType, daysOpen: c.daysOpen, description: (c.description || "").slice(0, 180), coverCharge: c.coverCharge,
    rating: c.rating, venueType: c.venueType, openingHours: c.openingHours, latitude: c.latitude, longitude: c.longitude,
    website: c.website, phone: c.phone,
  }));
  return <ClubsClient clubs={clubs} />;
}

export async function generateMetadata() {
  const base = defaultMetadata as { title?: unknown; description?: string };
  const title = typeof base.title === "string" ? base.title : (base.title as { default?: string } | undefined)?.default ?? "";
  return { ...defaultMetadata, ...(await pageMetadata("clubs", { title, description: base.description ?? "" })) };
}
