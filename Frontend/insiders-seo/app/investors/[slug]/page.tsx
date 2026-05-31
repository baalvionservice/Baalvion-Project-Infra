import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvestors, getInvestor, findInvestorBySlug, SITE_URL } from "@/lib/api";
import { investorTitle, investorDesc, usd, sectorSlug, titleCase } from "@/lib/seo";
import { JsonLd, Avatar, Badge } from "@/components/ui";

export const revalidate = 300; // seconds — must be a static literal (Next segment config)
export const dynamicParams = true; // new investors render on-demand, then cache (quick indexing)

export async function generateStaticParams() {
  return (await getInvestors()).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const base = await findInvestorBySlug(slug);
  if (!base) return { title: "Investor not found" };
  return {
    title: investorTitle(base),
    description: investorDesc(base),
    alternates: { canonical: `/investors/${base.slug}` },
    openGraph: { title: investorTitle(base), description: investorDesc(base), url: `${SITE_URL}/investors/${base.slug}`, type: "profile" },
  };
}

export default async function InvestorProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = await findInvestorBySlug(slug);
  if (!base) notFound();
  const i = (await getInvestor(base.id)) || base;
  const investments = i.recent_investments || [];

  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: i.firm || i.name,
          description: i.thesis || undefined,
          url: `${SITE_URL}/investors/${i.slug}`,
          sameAs: [i.website, i.linkedin_url].filter(Boolean),
          areaServed: i.region || undefined,
          knowsAbout: i.focus_sectors || undefined,
        }}
      />
      <div className="crumbs"><Link href="/">Home</Link> / <Link href="/investors">Investors</Link> / {i.firm || i.name}</div>

      <div className="profile-head">
        <Avatar src={i.avatar_url} alt={i.firm || i.name || "Investor"} />
        <div>
          <h1>{i.firm || i.name} {i.is_verified ? "✓" : ""}</h1>
          <div className="muted">{[i.title, i.firm_type, i.location || i.region].filter(Boolean).join(" · ")}</div>
        </div>
      </div>

      {i.thesis && <p style={{ maxWidth: 760 }} className="muted">{i.thesis}</p>}

      <div className="badges" style={{ marginTop: 14 }}>
        {(i.focus_sectors || []).map((s) => (
          <Link key={s} href={`/investors/sector/${sectorSlug(s)}`}><Badge accent>{s}</Badge></Link>
        ))}
        {(i.stages || []).map((s) => <Badge key={s}>{s}</Badge>)}
        {i.deals_backed ? <Badge>{i.deals_backed} deals backed</Badge> : null}
      </div>

      <section className="section">
        <h2>Recent investments</h2>
        {investments.length === 0 ? (
          <p className="muted">No public investments recorded yet.</p>
        ) : (
          <table className="inv-table">
            <thead><tr><th>Company</th><th>Round</th><th>Amount</th><th>Date</th><th>Source</th></tr></thead>
            <tbody>
              {investments.map((inv, idx) => (
                <tr key={idx}>
                  <td>{inv.target_company}</td>
                  <td className="muted">{inv.round || "—"}</td>
                  <td className="muted">{usd(inv.amount_usd) || "—"}</td>
                  <td className="muted">{inv.invested_on || "—"}</td>
                  <td className="muted">{inv.source_url ? <a href={inv.source_url} rel="nofollow noopener" target="_blank">{inv.source_name || "link"}</a> : inv.source_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="cta">
        <strong>Are you raising in {(i.focus_sectors || [])[0] || "this space"}?</strong>
        <p className="muted" style={{ margin: "6px 0 14px" }}>Create a founder profile on Baalvion and request an intro to {i.firm || i.name}.</p>
        <a className="btn" href="https://insiders.baalvion.com/auth">Get funded on Baalvion</a>
      </div>
    </div>
  );
}
