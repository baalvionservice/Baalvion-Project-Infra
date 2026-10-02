import { Metadata } from "next";
import { EventClient } from "./event-client";
import { CLUB_EVENTS } from "@/data/events-data";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params;
  const event = CLUB_EVENTS.find(e => e.id === eventId);
  return {
    title: `${event ? event.eventName : "Event"} at ${event ? event.venue : "Club"}`,
    description: `Join the guest list or book a VIP table for ${event?.eventName} at ${event?.venue}.`,
  };
}

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = CLUB_EVENTS.find(e => e.id === eventId);
  if (!event) return notFound();
  
  return <EventClient event={event} />;
}
