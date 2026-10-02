import { Metadata } from "next";
import { ClubsClient } from "../clubs-client";

export const metadata: Metadata = {
  title: "Premium Nightclubs | Market Underworld",
  description: "Get on the free guest list for top nightclubs. Book VIP bottle service, check lineups, dress codes & prices.",
};

export default function StateClubsPage({ params }: { params: { state: string } }) {
  const state = params.state; // e.g. "mumbai", "delhi", "gurgaon"
  return <ClubsClient preselectedState={state} />;
}
