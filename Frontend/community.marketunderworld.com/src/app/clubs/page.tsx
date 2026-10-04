import { Metadata } from "next";
import { ClubsClient } from "./clubs-client";
import { getClubs } from "@/lib/api/nightlife";

export const metadata: Metadata = {
  title: "Indian Nightclubs | Free Guest Lists & VIP Tables",
  description: "Get on the free guest list for top nightclubs in Mumbai, Delhi, and Gurgaon.",
};

export default async function ClubsRootPage() {
  return <ClubsClient clubs={await getClubs()} />;
}
