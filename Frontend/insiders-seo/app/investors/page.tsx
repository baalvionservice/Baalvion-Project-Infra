import type { Metadata } from "next";
import Link from "next/link";
import { getInvestors } from "@/lib/api";
import { sectorsFrom, titleCase } from "@/lib/seo";
import { Badge } from "@/components/ui";

export const revalidate = 300; // seconds — must be a static literal (Next segment config)

export const metadata: Metadata = {
  title: "Active Investors — Browse by Sector & Stage",
  description:
    "Browse active investors on Baalvion by sector, stage and region. See who recently funded businesses like yours and connect to raise faster.",
  alternates: { canonical: "/investors" },
};

export default async function InvestorsDirectory() {
  const investors = await getInvestors();
  const sectors = sectorsFrom(investors);

  return (
    <div className="container">
      <div className="crumbs"><Link href="/">Home</Link> / Investors</div>
      <section className="hero" style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 34 }}>Active investors</h1>
        <p>Find investors actively writing checks — filter by the sector and stage you’re raising for.</p>
      </section>

      {sectors.length > 0 && (
        <div className="badges" style={{ marginBottom: 26 }}>
          {sectors.map((s) => (
            <Link key={s.slug} href={`/investors/sector/${s.slug}`}><Badge accent>{titleCase(s.sector)} · {s.count}</Badge></Link>
          ))}
        </div>
      )}

      <div className="grid">
        {investors.map((i) => (
          <Link key={i.id} href={`/investors/${i.slug}`} className="card">
            <h3>{i.firm || i.name} {i.is_verified ? "✓" : ""}</h3>
            <div className="sub">{i.title || i.firm_type} {i.region ? `· ${i.region}` : ""}</div>
            <p>{i.thesis}</p>
            <div className="badges">
              {(i.focus_sectors || []).slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
              {(i.stages || []).slice(0, 2).map((s) => <Badge key={s}>{s}</Badge>)}
              {i.deals_backed ? <Badge accent>{i.deals_backed} deals</Badge> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
