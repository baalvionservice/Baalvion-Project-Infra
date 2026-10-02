import { Metadata } from "next";
import { VipTablesClient } from "./vip-tables-client";
import { INDIAN_CLUBS } from "@/data/clubs-data";
import { notFound } from "next/navigation";

export function generateMetadata({ params }: { params: { clubId: string } }): Metadata {
  const club = INDIAN_CLUBS.find(c => c.id === params.clubId);
  return {
    title: `${club ? club.name : "Club"} VIP Table Reservations | Bottle Service`,
    description: `Book VIP bottle service tables at ${club ? club.name : "the club"}. Premium package starting prices, minimums & table map.`,
  };
}

export default function VipTablesPage({ params }: { params: { clubId: string; state: string } }) {
  const club = INDIAN_CLUBS.find(c => c.id === params.clubId);
  if (!club) return notFound();
  return <VipTablesClient club={club} state={params.state} />;
}
