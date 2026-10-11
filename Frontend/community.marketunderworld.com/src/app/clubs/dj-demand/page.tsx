import { Metadata } from "next";
import { DjDemandClient } from "./dj-demand-client";

export const metadata: Metadata = {
  title: "Demand Your DJ | Baalvion",
  description: "Propose a DJ for a club and pledge wallet points toward bringing them. Pledges are held until an admin confirms the booking, and refunded if it does not happen.",
  alternates: { canonical: "/clubs/dj-demand" },
};

export default function DjDemandPage() {
  return <DjDemandClient />;
}
