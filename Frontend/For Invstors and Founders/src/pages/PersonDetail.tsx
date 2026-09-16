import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import PageSeo from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, ChevronRight, Briefcase, Building2 } from "lucide-react";
import { getPerson, type Person } from "@/lib/publicApi";
import { founderPath, investorPath, personPath } from "@/lib/directory-url";

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "—";

export default function PersonDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPerson(String(slug))
      .then((row) => { if (!row) navigate("/investors", { replace: true }); else setP(row); })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return <MainLayout><div className="container mx-auto px-4 py-10 max-w-4xl space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40 w-full" /></div></MainLayout>;
  }
  if (!p) return null;

  const firms = p.affiliations.filter((a) => a.side === "investor");
  const companies = p.affiliations.filter((a) => a.side === "company");
  const place = [p.city, p.state_or_country].filter(Boolean).join(", ") || null;

  const Row = ({ a }: { a: Person["affiliations"][number] }) => (
    <li>
      <Link
        to={a.side === "investor" ? investorPath({ id: a.entity_id, slug: a.entity_slug }) : founderPath({ id: a.entity_id, slug: a.entity_slug })}
        className="group flex items-start justify-between gap-6 py-4"
      >
        <div className="min-w-0">
          <h3 className="font-semibold text-primary group-hover:underline">{a.entity_name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(a.relationships || []).join(", ") || "Named on filing"}
            {a.entity_kind && <span> · {a.entity_kind}</span>}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {[a.entity_city, a.entity_state, a.entity_country].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
        <div className="hidden sm:flex items-start gap-8 shrink-0 text-right">
          <div>
            <div className="label-eyebrow">Filings</div>
            <div className="text-sm font-semibold mt-0.5 tabular-nums">{a.filings_count}</div>
          </div>
          <div>
            <div className="label-eyebrow">Last seen</div>
            <div className="text-sm font-semibold mt-0.5 whitespace-nowrap">{fmtDate(a.last_seen)}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-primary" />
        </div>
      </Link>
    </li>
  );

  return (
    <MainLayout>
      <PageSeo
        title={`${p.full_name} — Roles on ${p.affiliations.length} SEC Filing${p.affiliations.length === 1 ? "" : "s"} | Baalvion`}
        description={
          `${p.full_name} is named on SEC Form D filings for ` +
          `${firms.length ? `${firms.length} investment firm${firms.length === 1 ? "" : "s"}` : ""}` +
          `${firms.length && companies.length ? " and " : ""}` +
          `${companies.length ? `${companies.length} compan${companies.length === 1 ? "y" : "ies"}` : ""}` +
          `${place ? `, based in ${place}` : ""}.`
        }
        path={personPath(p.full_name)}
        // One affiliation is one fact — roughly fifteen words. The page stays for readers and for
        // internal linking, but asking Google to index 148,906 of these would bury the 32,839 that
        // actually say something, and is what scaled-content penalties target.
        noIndex={p.affiliations.length < 2}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: p.full_name,
          address: place || undefined,
          affiliation: p.affiliations.map((a) => ({ "@type": "Organization", name: a.entity_name })),
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>

        <div className="pb-8 border-b border-foreground/80">
          <div className="label-eyebrow mb-2">Person</div>
          <h1 className="text-3xl lg:text-4xl font-semibold">{p.full_name}</h1>
          {place && <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{place}</p>}
        </div>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 py-7 border-b border-border mb-8">
          {[
            { label: "Investment firms", value: String(firms.length) },
            { label: "Companies", value: String(companies.length) },
            { label: "First seen", value: fmtDate(p.first_seen) },
            { label: "Last seen", value: fmtDate(p.last_seen) },
          ].map((f) => (
            <div key={f.label}>
              <dt className="label-eyebrow">{f.label}</dt>
              <dd className="text-xl font-semibold mt-1 tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>

        {firms.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold pb-2 border-b border-foreground/80 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />At investment firms
            </h2>
            <ul className="rule-list">{firms.map((a) => <Row key={`i-${a.entity_id}`} a={a} />)}</ul>
          </section>
        )}

        {companies.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold pb-2 border-b border-foreground/80 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />At companies
            </h2>
            <ul className="rule-list">{companies.map((a) => <Row key={`c-${a.entity_id}`} a={a} />)}</ul>
          </section>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-6">
          Compiled from SEC Form D filings, which name executives, directors and promoters. Roles are as
          filed and may be out of date. Form D gives a person no identifier, so this page matches on name
          alone — if two people share a name, both appear here.
        </p>
      </div>
    </MainLayout>
  );
}
