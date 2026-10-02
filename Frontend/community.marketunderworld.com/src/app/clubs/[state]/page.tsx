import { Metadata } from "next";
import { ClubsClient } from "../clubs-client";

export const metadata: Metadata = {
  title: "Premium Nightclubs | Market Underworld",
  description: "Get on the free guest list for top nightclubs. Book VIP bottle service, check lineups, dress codes & prices.",
};

export default async function StateClubsPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  return <ClubsClient preselectedState={state} />;
}
