import { Metadata } from "next";
import { GuestListClient } from "./guest-list-client";
import { INDIAN_CLUBS } from "@/data/clubs-data";
import { notFound } from "next/navigation";

export function generateMetadata({ params }: { params: { clubId: string } }): Metadata {
  const club = INDIAN_CLUBS.find(c => c.id === params.clubId);
  return {
    title: `${club ? club.name : 'Club'} Guest List | Free Entry`,
    description: `Sign up for the free guest list at ${club ? club.name : 'the club'}. Skip the lines!`,
  };
}

export default function GuestListPage({ params }: { params: { clubId: string, state: string } }) {
  const club = INDIAN_CLUBS.find(c => c.id === params.clubId);
  if (!club) return notFound();

  return <GuestListClient club={club} state={params.state} />;
}
