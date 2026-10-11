import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClubsClient } from "../clubs-client";
import { getClubs } from "@/lib/api/nightlife";
import { INDIAN_NIGHTLIFE_STATES } from "@/data/clubs-data";

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export const metadata: Metadata = {
  title: "Premium Nightclubs | Market Underworld",
  description: "Get on the free guest list for top nightclubs. Book VIP bottle service, check lineups, dress codes & prices.",
};

export default async function StateClubsPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const clubs = await getClubs();
  const known = INDIAN_NIGHTLIFE_STATES.some((s) => toSlug(s) === state)
    || clubs.some((c) => toSlug(c.state) === state || toSlug(c.city ?? "") === state);
  if (!known) notFound();
  return <ClubsClient clubs={clubs} preselectedState={state} />;
}
