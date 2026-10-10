import { Metadata } from "next";
import { ClubsClient } from "../clubs-client";
import { getClubs } from "@/lib/api/nightlife";
import { INDIAN_NIGHTLIFE_STATES } from "@/data/clubs-data";

const STATE_CITY_MAP: Record<string, string> = {
  "maharashtra": "Mumbai",
  "delhi-nct": "Delhi",
  "delhi-ncr": "Gurgaon",
  "karnataka": "Bangalore",
  "goa": "Goa",
  "telangana": "Hyderabad",
  "punjab": "Chandigarh",
  "west-bengal": "Kolkata",
  "tamil-nadu": "Chennai",
  "rajasthan": "Jaipur",
};

const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const matched = INDIAN_NIGHTLIFE_STATES.find((s) => toSlug(s) === state);
  const stateName = matched ?? state;
  const city = STATE_CITY_MAP[state] ?? stateName;

  return {
    title: `Best Nightclubs in ${city} 2026 | Guest List & VIP Tables | ${stateName}`,
    description: `Discover top nightclubs in ${city}, ${stateName}. Get free guest list access, book VIP bottle service tables, check DJ lineups, dress codes and cover charges for 2026.`,
    keywords: [
      `nightclubs in ${city}`,
      `${city} clubs 2026`,
      `best pubs ${city}`,
      `${city} VIP table booking`,
      `${city} guest list`,
      `${stateName} nightlife`,
      `clubs near ${city}`,
      `${city} party places`,
    ],
    openGraph: {
      title: `Top Nightclubs in ${city} — Guest List & VIP Tables 2026`,
      description: `Find and book the best nightclubs in ${city}. Free guest list, bottle service, DJ nights and more.`,
      type: "website",
    },
    alternates: {
      canonical: `/clubs/${state}`,
    },
  };
}

export default async function StateClubsPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  return <ClubsClient clubs={await getClubs()} preselectedState={state} />;
}
