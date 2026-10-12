import type { Metadata } from "next";
import { EventDetailClient } from "./event-detail-client";
import { PageContent } from "@/components/cms/page-content";
import { getEvent } from "@/lib/api/nightlife";
import { getPage, SITE_URL } from "@/lib/cms";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [e, p] = await Promise.all([getEvent(id), getPage(`clubs/events/${id}`)]);
  if (!e) return { title: "Event not found", robots: { index: false } };
  const when = new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const title = p?.seoTitle || `${e.eventName} at ${e.venue}, ${e.city} (${when})`;
  const description = p?.seoDescription || `${e.eventName}${e.djName ? ` with ${e.djName}` : ""} at ${e.venue}, ${e.city} on ${when}.${e.ticketPriceText ? ` ${e.ticketPriceText}.` : ""} Guest list and VIP table requests on Hell Road.`;
  return {
    title, description, alternates: { canonical: `/clubs/events/${id}` }, robots: p?.noindex ? { index: false } : undefined,
    openGraph: { title, description, type: "website", url: `${SITE_URL}/clubs/events/${id}`, ...(e.image ? { images: [e.image] } : {}) },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await getEvent(id);
  const ld = e && {
    "@context": "https://schema.org", "@type": "Event", name: e.eventName, startDate: e.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: e.venue, address: e.city }, ...(e.image ? { image: [e.image] } : {}),
    ...(e.djName ? { performer: { "@type": "Person", name: e.djName } } : {}), ...(e.description ? { description: e.description } : {}),
    ...(e.ticketUrl ? { offers: { "@type": "Offer", url: e.ticketUrl, availability: "https://schema.org/InStock", ...(e.ticketPriceText ? { description: e.ticketPriceText } : {}) } } : {}),
  };
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <EventDetailClient id={id} />
      <PageContent slug={`clubs/events/${id}`} heading="About this event" />
    </>
  );
}
