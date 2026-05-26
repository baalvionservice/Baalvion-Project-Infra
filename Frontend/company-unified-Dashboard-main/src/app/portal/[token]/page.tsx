import { notFound } from "next/navigation";
import PinEntry from "./pin-entry";
import PortalDashboard from "./portal-dashboard";
import portalsData from "@/lib/data/portals.json";
import { cookies } from "next/headers";
import ClientPortalPage from "./client-page";

export type PortalConfig = (typeof portalsData)[0];

function getPortalConfig(token: string): PortalConfig | undefined {
  return portalsData.find((p) => p.id === token);
}

export default async function PublicPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const portal = getPortalConfig(token);

  if (!portal) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`portal-session-${portal.id}`);
  const hasAccess = sessionCookie?.value === "true";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-muted">
      <ClientPortalPage portal={portal} initialAccess={hasAccess} />
    </main>
  );
}
