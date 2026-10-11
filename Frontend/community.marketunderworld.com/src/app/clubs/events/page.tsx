import { Metadata } from "next";
import { CelebrityEventsClient } from "./events-client";

export const metadata: Metadata = {
  title: "Club Events and DJ Nights | Baalvion",
  description: "Upcoming DJ nights and appearances at partner clubs, entered by the Baalvion team.",
  alternates: { canonical: "/clubs/events" },
};

export default function EventsPage() {
  return <CelebrityEventsClient />;
}
