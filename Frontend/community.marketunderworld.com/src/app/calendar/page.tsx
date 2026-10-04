import { Metadata } from "next";
import { CalendarClient } from "./calendar-client";
import { getEvents } from "@/lib/api/nightlife";

export const metadata: Metadata = {
  title: "Nightclub Event Calendar & DJ Schedule | Mumbai, Delhi, Gurgaon",
  description: "View all nightclub events in Mumbai, Delhi, and Gurgaon. Buy tickets, get on free guest lists, or book a VIP table. Search by venue or date.",
};

export default async function CalendarPage() {
  return <CalendarClient events={await getEvents()} />;
}
