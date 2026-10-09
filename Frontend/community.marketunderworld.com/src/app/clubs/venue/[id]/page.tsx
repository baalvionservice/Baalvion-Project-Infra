import { redirect } from "next/navigation";
import { getClub } from "@/lib/api/nightlife";
import { Metadata } from "next";

// /clubs/venue/[id] → canonical is /clubs/[state]/[clubId]
// We redirect so SEO juice flows to the authoritative URL.

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) return {};
  return {
    title: `${club.name} — ${club.city} Nightclub | Baalvion`,
    description: club.description ?? `Book a VIP table or guest list at ${club.name} in ${club.city}.`,
    alternates: { canonical: `/clubs/${club.state?.toLowerCase().replace(/ /g, "-")}/${club.id}` },
  };
}

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await getClub(id);

  if (!club) {
    redirect("/clubs");
  }

  const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  redirect(`/clubs/${toSlug(club.state)}/${club.id}`);
}
