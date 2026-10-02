import { Metadata } from "next";
import { ClubsClient } from "./clubs-client";

export const metadata: Metadata = {
  title: "Indian Nightclubs | Free Guest Lists & VIP Tables",
  description: "Get on the free guest list for top nightclubs in Mumbai, Delhi, and Gurgaon.",
};

export default function ClubsRootPage() {
  return <ClubsClient />;
}
