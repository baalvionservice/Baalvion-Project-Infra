import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFounders, findFounderBySlug, SITE_URL, REVALIDATE } from "@/lib/api";
import { founderTitle, founderDesc } from "@/lib/seo";
import { JsonLd, Avatar, Badge } from "@/components/ui";

export const revalidate = REVALIDATE;
export const dynamicParams = true; // new founders render on-demand, then cache (quick indexing)

export async function generateStaticParams() {
  return (await getFounders()).map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const f = await findFounderBySlug(params.slug);
  if (!f) return { title: "Founder not found" };
  return {
    title: founderTitle(f),
    description: founderDesc(f),
    alternates: { canonical: `/founders/${f.slug}` },
    openGraph: { title: founderTitle(f), description: founderDesc(f), url: `${SITE_URL}/founders/${f.slug}`, type: "profile" },
  };
}

export default async function FounderProfile({ params }: { params: { slug: string } }) {
  const f = await findFounderBySlug(params.slug);
  if (!f) notFound();

  return (
    <div className="container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: f.company_name || f.full_name,
          description: f.company_about || f.headline || undefined,
          url: `${SITE_URL}/founders/${f.slug}`,
          sameAs: [f.website, f.linkedin_url].filter(Boolean),
          founder: f.full_name ? { "@type": "Person", name: f.full_name } : undefined,
          industry: f.sector || undefined,
          areaServed: f.region || undefined,
        }}
      />
      <div className="crumbs"><Link href="/">Home</Link> / <Link href="/founders">Founders</Link> / {f.company_name}</div>

      <div className="profile-head">
        <Avatar src={f.avatar_url} alt={f.company_name || f.full_name || "Founder"} />
        <div>
          <h1>{f.company_name}</h1>
          <div className="muted">{[f.full_name && `Founded by ${f.full_name}`, f.sector, f.stage, f.region].filter(Boolean).join(" · ")}</div>
        </div>
      </div>

      {f.headline && <p style={{ maxWidth: 760, fontSize: 18 }}>{f.headline}</p>}
      {f.company_about && <p style={{ maxWidth: 760 }} className="muted">{f.company_about}</p>}

      <div className="badges" style={{ marginTop: 14 }}>
        {f.sector ? <Badge accent>{f.sector}</Badge> : null}
        {f.stage ? <Badge>{f.stage}</Badge> : null}
        {f.region ? <Badge>{f.region}</Badge> : null}
        {f.website ? <a href={f.website} rel="nofollow noopener" target="_blank"><Badge>Website</Badge></a> : null}
        {f.linkedin_url ? <a href={f.linkedin_url} rel="nofollow noopener" target="_blank"><Badge>LinkedIn</Badge></a> : null}
      </div>

      <div className="cta">
        <strong>Investor?</strong>
        <p className="muted" style={{ margin: "6px 0 14px" }}>Connect with {f.company_name} and request the full data room on Baalvion.</p>
        <a className="btn" href="https://insiders.baalvion.com/auth">Join as an investor</a>
      </div>
    </div>
  );
}
