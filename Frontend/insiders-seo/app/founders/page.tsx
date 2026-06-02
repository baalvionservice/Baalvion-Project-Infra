import type { Metadata } from "next";
import Link from "next/link";
import { getFounders } from "@/lib/api";
import { Badge } from "@/components/ui";

export const revalidate = 300; // seconds — must be a static literal (Next segment config)

export const metadata: Metadata = {
  title: "Founders Raising Now — Discover Startups",
  description:
    "Discover founders and startups raising on Baalvion, by sector and stage. Investors: find your next deal.",
  alternates: { canonical: "/founders" },
  openGraph: {
    title: "Founders Raising Now — Discover Startups",
    description: "Discover founders and startups raising on Baalvion, by sector and stage. Investors: find your next deal.",
    url: "/founders",
    type: "website",
    siteName: "Baalvion Insiders",
  },
};

export default async function FoundersDirectory() {
  const founders = await getFounders();
  return (
    <div className="container">
      <div className="crumbs"><Link href="/">Home</Link> / Founders</div>
      <section className="hero" style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 34 }}>Founders raising now</h1>
        <p>Startups raising on Baalvion. Investors — discover your next deal by sector and stage.</p>
      </section>
      <div className="grid">
        {founders.map((f) => (
          <Link key={f.id} href={`/founders/${f.slug}`} className="card">
            <h3>{f.company_name}</h3>
            <div className="sub">{[f.sector, f.stage, f.region].filter(Boolean).join(" · ")}</div>
            <p>{f.headline || f.company_about}</p>
            <div className="badges">
              {f.sector ? <Badge accent>{f.sector}</Badge> : null}
              {f.stage ? <Badge>{f.stage}</Badge> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
