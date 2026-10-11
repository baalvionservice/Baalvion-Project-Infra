import { Metadata } from "next";
import { ClubsClient } from "./clubs-client";
import { getClubs } from "@/lib/api/nightlife";

export const metadata: Metadata = {
  title: "Best Nightclubs in India 2026 | Free Guest Lists & VIP Tables",
  description: "Discover the best nightclubs across Mumbai, Delhi NCR, Bangalore and more. Get on the free guest list, book premium VIP bottle service, check cover charges, and explore DJ lineups for 2026.",
  keywords: [
    "best nightclubs India",
    "VIP table booking",
    "club guest list India",
    "nightlife Mumbai",
    "nightlife Delhi",
    "club cover charge",
    "book nightclub tables",
    "top pubs 2026",
    "party places",
  ],
  openGraph: {
    title: "Best Nightclubs in India 2026 | Guest Lists & VIP Tables",
    description: "Explore India's top nightlife destinations. Book VIP tables or join the free guest list at premium venues.",
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
    rating: c.rating, venueType: c.venueType, openingHours: c.openingHours,
  }));
  return <ClubsClient clubs={clubs} />;
}
