import { Metadata } from "next";
import { GuestListClient } from "./guest-list-client";
import { getClub } from "@/lib/api/nightlife";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ clubId: string }> }): Promise<Metadata> {
  const { clubId } = await params;
  const club = await getClub(clubId);
  return {
    title: `${club ? club.name : 'Club'} Guest List | Free Entry`,
    description: `Sign up for the free guest list at ${club ? club.name : 'the club'}. Skip the lines!`,
  };
}

export default async function GuestListPage({ params }: { params: Promise<{ clubId: string, state: string }> }) {
  const { clubId, state } = await params;
  const club = await getClub(clubId);
  if (!club) return notFound();

  return <GuestListClient club={club} state={state} />;
}
