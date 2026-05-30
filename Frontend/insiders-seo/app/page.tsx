import Link from "next/link";
import { getInvestors, getFounders, SITE_URL, REVALIDATE } from "@/lib/api";
import { sectorsFrom, titleCase } from "@/lib/seo";
import { JsonLd, Badge } from "@/components/ui";

export const revalidate = REVALIDATE;

export default async function Home() {
  const [investors, founders] = await Promise.all([getInvestors(), getFounders()]);
  const sectors = sectorsFrom(investors).slice(0, 10);
  const featured = investors.slice(0, 6);

  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Baalvion Insiders",
          url: SITE_URL,
          description: "A platform where founders find active investors and get funded faster.",
        }}
      />
      <section className="hero">
        <h1>Where founders meet investors who just funded businesses like theirs.</h1>
        <p>
          Baalvion connects founders with <strong>active investors</strong> — filtered by sector, stage and
          recent deals — so you reach the right backers and raise your round faster. {investors.length} investors
          and {founders.length} founders and counting.
        </p>
        <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn" href="/investors">Browse investors</Link>
          <Link className="btn" href="/founders" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderColor: "rgba(99,102,241,0.3)" }}>
            Browse founders
          </Link>
        </div>
      </section>

      {sectors.length > 0 && (
        <section className="section">
          <h2>Investors by sector</h2>
          <div className="badges">
            {sectors.map((s) => (
              <Link key={s.slug} href={`/investors/sector/${s.slug}`}>
                <Badge accent>{titleCase(s.sector)} · {s.count}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="section">
          <h2>Active investors</h2>
          <div className="grid">
            {featured.map((i) => (
              <Link key={i.id} href={`/investors/${i.slug}`} className="card">
                <h3>{i.firm || i.name}</h3>
                <div className="sub">{i.title || i.firm_type} {i.region ? `· ${i.region}` : ""}</div>
                <p>{i.thesis}</p>
                <div className="badges">
                  {(i.focus_sectors || []).slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
                  {i.deals_backed ? <Badge accent>{i.deals_backed} deals</Badge> : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
