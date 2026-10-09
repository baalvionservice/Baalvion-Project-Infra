import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CELEBRITY_EVENTS } from "@/data/celebrity-events";
import { EventDetailClient } from "./event-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = CELEBRITY_EVENTS.find(e => e.id === id);
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.title} | ${event.clubName}, ${event.city}`,
    description: event.description,
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = CELEBRITY_EVENTS.find(e => e.id === id);
  if (!event) notFound();
  return <EventDetailClient event={event} />;
}
