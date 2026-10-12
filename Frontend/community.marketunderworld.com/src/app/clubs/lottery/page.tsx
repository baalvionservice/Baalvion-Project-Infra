import { Metadata } from "next";
import { LotteryClient } from "./lottery-client";
import { PageContent } from "@/components/cms/page-content";
import { pageMetadata } from "@/lib/cms";
import { getDraws } from "@/lib/api/draws-server";
import Link from "next/link";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("clubs/lottery", {
  title: "Club Ticket Draw: India and Dubai",
  description: "Enter the club ticket draw with your wallet points. Winners are picked by a recorded random draw and listed by member number. 18+ only.",
});

export default async function LotteryPage() {
  const draws = await getDraws();
  return (
    <>
      <LotteryClient />
      {draws.length > 0 && (
        <nav aria-label="Every draw" className="max-w-[900px] mx-auto px-4 py-6 text-sm">
          <h2 className="font-bold mb-2">Every draw, with its own page</h2>
          <ul className="flex flex-wrap gap-2">{draws.map((d) => <li key={d.id}><Link href={`/clubs/lottery/${d.id}`} className="inline-block border border-gray-300 px-3 py-1.5 hover:border-black">{d.title}{d.state ? ` (${d.state})` : ""}</Link></li>)}</ul>
        </nav>
      )}
      <PageContent slug="clubs/lottery" heading="About the ticket draw" />
    </>
  );
}
