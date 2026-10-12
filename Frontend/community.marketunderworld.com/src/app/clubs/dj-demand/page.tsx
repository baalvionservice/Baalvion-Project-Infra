import { pageMetadata } from "@/lib/cms";
import { Metadata } from "next";
import { DjDemandClient } from "./dj-demand-client";

const defaultMetadata: Metadata = {
  title: "Demand Your DJ | Baalvion",
  description: "Propose a DJ for a club and pledge wallet points toward bringing them. Pledges are held until an admin confirms the booking, and refunded if it does not happen.",
  alternates: { canonical: "/clubs/dj-demand" },
};

export default function DjDemandPage() {
  return <DjDemandClient />;
}

export async function generateMetadata() {
  const base = defaultMetadata as { title?: unknown; description?: string };
  const title = typeof base.title === "string" ? base.title : (base.title as { default?: string } | undefined)?.default ?? "";
  return { ...defaultMetadata, ...(await pageMetadata("clubs/dj-demand", { title, description: base.description ?? "" })) };
}
