import { pageMetadata } from "@/lib/cms";
import { Metadata } from "next";
import { CelebrityEventsClient } from "./events-client";

const defaultMetadata: Metadata = {
  title: "Club Events and DJ Nights | Baalvion",
  description: "Upcoming DJ nights and appearances at partner clubs, entered by the Baalvion team.",
  alternates: { canonical: "/clubs/events" },
};

export default function EventsPage() {
  return <CelebrityEventsClient />;
}

export async function generateMetadata() {
  const base = defaultMetadata as { title?: unknown; description?: string };
  const title = typeof base.title === "string" ? base.title : (base.title as { default?: string } | undefined)?.default ?? "";
  return { ...defaultMetadata, ...(await pageMetadata("clubs/events", { title, description: base.description ?? "" })) };
}
