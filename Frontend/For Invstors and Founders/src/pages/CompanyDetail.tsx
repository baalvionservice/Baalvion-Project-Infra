import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import PageSeo from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, ChevronRight, ExternalLink, FileText, Building2 } from "lucide-react";
import { getPublicCompany, type PublicCompany } from "@/lib/publicApi";
import { money } from "@/lib/investor";
import { isRegistryRecord, sourceInfo } from "@/lib/company-source";
import ClaimProfileDialog from "@/components/directory/ClaimProfileDialog";
import { founderPath, placePath } from "@/lib/directory-url";

// Form D encodes "indefinite offering" as a zero target rather than a blank.
const INDEFINITE = 0;
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState<PublicCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicCompany(String(id))
      .then((row) => { if (!row) navigate("/founders", { replace: true }); else setC(row); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return <MainLayout><div className="container mx-auto px-4 py-10 max-w-5xl space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40 w-full" /></div></MainLayout>;
  }
  if (!c) return null;

  const place = [c.city, c.state, c.country].filter(Boolean).join(", ") || c.location || "—";
  const filings = c.filings || [];
  const src = sourceInfo(c.source);
  const registry = isRegistryRecord(c.source);
  const people = c.people || [];

  const crumbs: { label: string; to?: string }[] = [
    { label: "Home", to: "/" },
    { label: "Companies", to: "/founders" },
    ...(c.country_slug ? [{ label: c.country as string, to: placePath("founders", { country: c.country_slug }) }] : []),
    ...(c.country_slug && c.state_slug ? [{ label: c.state as string, to: placePath("founders", { country: c.country_slug, state: c.state_slug }) }] : []),
    ...(c.country_slug && c.city_slug ? [{ label: c.city as string, to: placePath("founders", { country: c.country_slug, state: c.state_slug || undefined, city: c.city_slug }) }] : []),
    { label: c.name },
  ];

  return (
    <MainLayout>
      <PageSeo
        title={`${c.name} — ${place} | Company Profile | Baalvion`}
        description={
          registry
            ? `${c.name} is a company registered in ${c.country || place}, based in ${place}` +
              `${c.industry_group ? `, working in ${c.industry_group.toLowerCase()}` : ""}` +
              `${c.founded_on ? `, registered ${fmtDate(c.founded_on)}` : ""}` +
              `${c.employees != null ? ` with ${c.employees} employees` : ""}.`
            : `${c.name} is a ${(c.industry_group || "private").toLowerCase()} company based in ${place}` +
              `${c.filing_count ? ` with ${c.filing_count} capital-raising filing${c.filing_count === 1 ? "" : "s"} on record` : ""}` +
              `${c.total_raised_usd ? `, ${money(c.total_raised_usd)} raised` : ""}` +
              `${c.last_filing_date ? `. Last SEC filing ${fmtDate(c.last_filing_date)}.` : "."}`
        }
        path={founderPath(c)}
        // A register record with no staff, no funding and no filings has nothing to rank on.
        noIndex={filings.length === 0 && c.employees == null && c.total_raised_usd == null}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: c.name,
          address: place,
          foundingDate: c.year_founded ? String(c.year_founded) : undefined,
          identifier: c.cik ? `SEC CIK ${c.cik}` : undefined,
          employee: people.slice(0, 10).map((p) => ({
            "@type": "Person",
            name: p.full_name,
            jobTitle: (p.relationships || []).join(", ") || undefined,
          })),
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/founders")}>
          <ArrowLeft className="w-4 h-4 mr-1" />All companies
        </Button>

        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground mb-5">
          {crumbs.map((b, i) => (
            <span key={`${b.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
              {b.to ? <Link to={b.to} className="hover:text-primary hover:underline">{b.label}</Link> : <span className="text-foreground">{b.label}</span>}
            </span>
          ))}
        </nav>

        <div className="pb-8 border-b border-foreground/80">
          <h1 className="text-3xl lg:text-4xl font-semibold">{c.name}</h1>
          <p className="text-base mt-1.5 text-muted-foreground">
            {c.industry_group || "Sector not stated"}
            {c.entity_type && <span> · {c.entity_type}</span>}
            {c.jurisdiction && <span> · {c.jurisdiction} entity</span>}
          </p>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{place}</p>
          {!c.claimed_at && (
            <div className="mt-5">
              <ClaimProfileDialog entityType="company" entityId={c.id} entityName={c.name} />
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 py-7 border-b border-border mb-8">
          {(registry ? [
            { label: "Founded", value: c.founded_on ? fmtDate(c.founded_on) : (c.year_founded ? String(c.year_founded) : "—") },
            { label: "Employees", value: c.employees != null ? String(c.employees) : "Not reported" },
            { label: "Status", value: c.status || "—" },
            { label: "Legal form", value: c.legal_form || "—" },
          ] : [
            { label: "Capital raised", value: money(c.total_raised_usd) },
            { label: "Largest round", value: money(c.largest_round_usd) },
            { label: "Filings on record", value: String(c.filing_count ?? filings.length) },
            { label: "Last filing", value: fmtDate(c.last_filing_date) },
          ]).map((f) => (
            <div key={f.label}>
              <dt className="label-eyebrow">{f.label}</dt>
              <dd className="text-xl font-semibold mt-1 tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="inline-flex mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {filings.length > 0 && <TabsTrigger value="rounds">Rounds <span className="ml-1 text-xs opacity-60">{filings.length}</span></TabsTrigger>}
            <TabsTrigger value="people">People <span className="ml-1 text-xs opacity-60">{people.length}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-border"><CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" />On the public record</h2>
                <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  {(registry ? [
                    ["Sector as registered", c.industry_group],
                    ["Industry code", c.industry_code],
                    ["Legal form", c.legal_form],
                    ["Status", c.status],
                    ["Registered", c.founded_on ? fmtDate(c.founded_on) : null],
                    ["Employees", c.employees != null ? String(c.employees) : null],
                    ["Registration number", c.registry_number],
                    ["Website", c.website],
                    ["Address", [c.street, place, c.postal_code].filter(Boolean).join(", ")],
                    ["Telephone", c.phone],
                  ] : [
                    ["Sector as filed", c.industry_group],
                    ["Annual revenue band", c.revenue_range === "Decline to Disclose" ? "Declined to disclose" : c.revenue_range],
                    ["Legal form", c.entity_type],
                    ["Incorporated in", c.jurisdiction],
                    ["Year formed", c.year_founded ? String(c.year_founded) : null],
                    ["SEC CIK", c.cik],
                    ["First filing", fmtDate(c.first_filing_date)],
                    ["Most recent filing", fmtDate(c.last_filing_date)],
                    ["Address as filed", [c.street, place, c.postal_code].filter(Boolean).join(", ")],
                    ["Telephone as filed", c.phone],
                  ]).map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="label-eyebrow">{label}</dt>
                      <dd className="text-sm font-medium mt-0.5">{(value as string) || <span className="text-muted-foreground font-normal">Not disclosed</span>}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent></Card>

              {/* Same rule as the investor side: state where every figure came from. */}
              <Card className="border-border"><CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Source</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Compiled from <strong className="font-medium text-foreground">{c.registry_name || src.label}</strong> —
                  {" "}{src.blurb}. Details are as recorded there.
                </p>
                <dl className="mt-4 space-y-2.5">
                  {!registry && (
                    <div className="flex justify-between gap-3 text-sm">
                      <dt className="text-muted-foreground">Filings used</dt><dd className="font-medium tabular-nums">{filings.length}</dd>
                    </div>
                  )}
                  {registry && c.registry_number && (
                    <div className="flex justify-between gap-3 text-sm">
                      <dt className="text-muted-foreground">Registration no.</dt><dd className="font-medium tabular-nums">{c.registry_number}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 text-sm">
                    <dt className="text-muted-foreground">Record updated</dt><dd className="font-medium">{fmtDate(c.last_verified_at)}</dd>
                  </div>
                </dl>
                {c.source_url && (
                  <a href={c.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    {registry ? "View in the register" : "Latest filing on SEC EDGAR"}<ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-primary hover:underline truncate">
                    {c.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  {registry
                    ? "Being on the register means this company exists and is trading, not that it is raising or that Baalvion has any relationship with it."
                    : "A filing means this company raised capital, not that it is currently raising or that Baalvion has any relationship with it."}
                </p>
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="rounds" className="mt-0">
            {filings.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No filings on record.</p>
            ) : (
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border bg-secondary/60">
                      <th className="py-2.5 px-3 font-medium">Filed as</th>
                      <th className="py-2.5 px-3 font-medium text-right">Sold</th>
                      <th className="py-2.5 px-3 font-medium text-right">Target</th>
                      <th className="py-2.5 px-3 font-medium text-right">Min</th>
                      <th className="py-2.5 px-3 font-medium text-right">Investors</th>
                      <th className="py-2.5 px-3 font-medium">First sale</th>
                      <th className="py-2.5 px-3 font-medium">Filed</th>
                      <th className="py-2.5 px-3 font-medium">Filing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filings.map((f) => (
                      <tr key={f.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40 align-top">
                        <td className="py-2.5 px-3">
                          <div className="font-medium">{f.entity_name || c.name}</div>
                          <div className="text-xs text-muted-foreground">{[f.industry_group, f.revenue_range].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium">{money(f.total_sold_usd)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{f.total_offering_usd === INDEFINITE ? "Indefinite" : money(f.total_offering_usd)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{f.min_investment_usd ? money(f.min_investment_usd) : "—"}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{f.investor_count ?? "—"}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(f.first_sale_date)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(f.filing_date)}{f.is_amendment && <span className="ml-1 text-[10px] uppercase tracking-wide">amd</span>}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {f.source_url
                            ? <a href={f.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">SEC<ExternalLink className="w-3 h-3" /></a>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Each row is one Form D filing. "Sold" is the amount reported at the time of that filing, so a
              company that files an amendment will show the same round more than once.
            </p>
          </TabsContent>

          <TabsContent value="people" className="mt-0">
            {people.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No individuals are named on this company's filings.</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
                  {people.map((p) => (
                    <div key={p.id} className="py-3 border-b border-border">
                      <div className="font-medium">{p.full_name}</div>
                      <div className="text-sm text-muted-foreground">{(p.relationships || []).join(", ") || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {[p.city, p.state_or_country].filter(Boolean).join(", ")}
                        {p.filings_count > 1 && <span> · on {p.filings_count} filings</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Executives, directors and promoters as named on the filings. Roles are as filed and may be
                  out of date; a director is not necessarily a founder.
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
