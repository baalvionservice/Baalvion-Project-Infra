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
  return <ClubsClient clubs={await getClubs()} />;
}
