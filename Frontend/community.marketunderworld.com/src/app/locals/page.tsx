import { Metadata } from "next";
import { LocalsClient } from "./locals-client";

export const metadata: Metadata = {
  title: "Mumbai Locals Hub - Casting Calls, Events & Jobs | Market Underworld",
  description: "Find the latest casting calls, dance shows, acting jobs, and local events in Mumbai, Delhi, and Goa. Connect with directors, event managers, and match with verified locals.",
  keywords: ["Mumbai casting calls", "Dancer jobs Mumbai", "Acting auditions Delhi", "Clubbing events Mumbai", "Local dating Mumbai", "Goa shows", "UGC video shoot Mumbai"],
  openGraph: {
    title: "Mumbai Locals Hub - Casting Calls & Events",
    description: "Discover real-time local opportunities for dancers, actors, and event-goers.",
    type: "website",
  }
};

export default function LocalsHubPage() {
  return <LocalsClient />;
}
