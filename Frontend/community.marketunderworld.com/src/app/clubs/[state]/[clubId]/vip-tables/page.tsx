import { Metadata } from "next";
import { VipTablesClient } from "./vip-tables-client";
import { INDIAN_CLUBS } from "@/data/clubs-data";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ clubId: string }> }): Promise<Metadata> {
  const { clubId } = await params;
  const club = INDIAN_CLUBS.find(c => c.id === clubId);
  return {
    title: `${club ? club.name : "Club"} VIP Table Reservations | Bottle Service`,
    description: `Book VIP bottle service tables at ${club ? club.name : "the club"}. Premium package starting prices, minimums & table map.`,
  };
}

export default async function VipTablesPage({ params }: { params: Promise<{ clubId: string; state: string }> }) {
  const { clubId, state } = await params;
  const club = INDIAN_CLUBS.find(c => c.id === clubId);
  if (!club) return notFound();
  return <VipTablesClient club={club} state={state} />;
}
