import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvestors, SITE_URL } from "@/lib/api";
import { sectorsFrom, investorsInSector, titleCase } from "@/lib/seo";
import { Badge } from "@/components/ui";

export const revalidate = 300; // seconds — must be a static literal (Next segment config)
export const dynamicParams = true;

export async function generateStaticParams() {
  return sectorsFrom(await getInvestors()).map((s) => ({ sector: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }): Promise<Metadata> {
  const { sector } = await params;
  const name = titleCase(sector);
  const title = `${name} Investors — Active Backers in ${name}`;
  const description = `Investors actively funding ${name} startups. See who recently invested in ${name} and connect on Baalvion to raise your round.`;
  return { title, description, alternates: { canonical: `/investors/sector/${sector}` }, openGraph: { title, description, url: `${SITE_URL}/investors/sector/${sector}` } };
}

export default async function SectorHub({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const investors = await getInvestors();
  const list = investorsInSector(investors, sector);
  if (list.length === 0) notFound();
  const name = titleCase(sector);

  return (
    <div className="container">
      <div className="crumbs"><Link href="/">Home</Link> / <Link href="/investors">Investors</Link> / {name}</div>
      <section className="hero" style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 32 }}>Investors in {name}</h1>
        <p>{list.length} active {name} investor{list.length > 1 ? "s" : ""} on Baalvion. Raising in {name}? Connect with the backers below.</p>
      </section>
      <div className="grid">
        {list.map((i) => (
          <Link key={i.id} href={`/investors/${i.slug}`} className="card">
            <h3>{i.firm || i.name}</h3>
            <div className="sub">{i.title || i.firm_type} {i.region ? `· ${i.region}` : ""}</div>
            <p>{i.thesis}</p>
            <div className="badges">
              {(i.stages || []).slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
              {i.deals_backed ? <Badge accent>{i.deals_backed} deals</Badge> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
