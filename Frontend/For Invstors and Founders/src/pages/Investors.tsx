import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import PageSeo from "@/components/seo/PageSeo";
import PageHeader, { type Crumb } from "@/components/directory/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BadgeCheck, MapPin, X, ChevronRight, ChevronLeft, SlidersHorizontal, ChevronDown, Users } from "lucide-react";
import { listPublicInvestors, searchPeople, type InvestorPage, type Facet, type PersonHit } from "@/lib/publicApi";
import { money, placeLabel, type Investor } from "@/lib/investor";
import { facetPath, investorPath, personPath, placePath, titleCasePlace } from "@/lib/directory-url";

export type { Investor } from "@/lib/investor";
export { money, checkRange } from "@/lib/investor";

const SORTS: Record<string, string> = {
  recent: "Most recent filing",
  raised: "Most capital raised",
  funds: "Most funds",
  name: "A–Z",
};

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "—";

function FacetGroup({ label, options, active, onPick }: {
  label: string; options: Facet[]; active?: string; onPick: (v: string | null) => void;
}) {
  if (!options.length) return null;
  return (
    <details open className="group border-b border-border py-3">
      <summary className="flex items-center justify-between cursor-pointer list-none select-none">
        <span className="text-sm font-medium">{label}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-2.5 space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {options.map((o) => {
          const on = active === o.value;
          return (
            <li key={o.value}>
              <button
                onClick={() => onPick(on ? null : o.value)}
                className="w-full flex items-baseline justify-between gap-3 text-left text-sm group/opt"
              >
                <span className={`${on ? "font-semibold text-primary" : "text-foreground/85"} group-hover/opt:text-primary truncate`}>{o.value}</span>
                <span className="text-xs tabular-nums text-muted-foreground shrink-0">{o.n.toLocaleString()}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export default function Investors() {
  // /investors and /investors/in/:country/:state?/:city? share this page. Place comes from the
  // path (so it is canonical and crawlable); search, type, sort and page live in the query string.
  const { country, state, city, facet } = useParams();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<InvestorPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState(params.get("q") || "");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [people, setPeople] = useState<PersonHit[]>([]);

  const q = params.get("q") || "";
  const type = params.get("type") || "";
  const sort = params.get("sort") || "recent";
  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);

  useEffect(() => { setDraft(q); }, [q]);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    listPublicInvestors({ country, state, city, q, type, type_slug: facet, sort, page, limit: 25 })
      .then(setData)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [country, state, city, facet, q, type, sort, page]);

  useEffect(() => {
    if (!q) { setPeople([]); return; }
    searchPeople(q, 8).then(setPeople).catch(() => setPeople([]));
  }, [q]);

  // Every control writes the URL, so a filtered view is a shareable, back-buttonable address.
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: false });
  };

  const rows = data?.investors || [];
  const total = data?.total ?? 0;
  const facets = data?.facets;

  const placeName = city || state || country ? titleCasePlace(city || state || country!) : null;
  // The facet's display value comes from the results, not a lookup table — so a page can never
  // announce a label the data does not actually use.
  const facetName = facet ? (rows[0]?.firm_type || titleCasePlace(facet)) : null;
  const scope = [facetName ? `${facetName} firms` : "Investors", placeName ? `in ${placeName}` : null].filter(Boolean).join(" ");
  const crumbs: Crumb[] = [{ label: "Home", to: "/" }, { label: "Investors", to: (country || facet) ? "/investors" : undefined }];
  if (facet) crumbs.push({ label: facetName || titleCasePlace(facet), to: country ? facetPath("investors", facet) : undefined });
  const here = (p: { country?: string; state?: string; city?: string }) =>
    facet ? facetPath("investors", facet, p) : placePath("investors", p);
  if (country) crumbs.push({ label: titleCasePlace(country), to: state || city ? here({ country }) : undefined });
  if (state) crumbs.push({ label: titleCasePlace(state), to: city ? here({ country, state }) : undefined });
  if (city) crumbs.push({ label: titleCasePlace(city) });

  const chips = useMemo(() => {
    const out: { label: string; value: string; clear: () => void }[] = [];
    if (q) out.push({ label: "Search", value: q, clear: () => setParam("q", null) });
    if (type) out.push({ label: "Type", value: type, clear: () => setParam("type", null) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, params]);

  return (
    <MainLayout>
      <PageSeo
        title={`${scope} — ${total.toLocaleString()} ${facetName ? "firms" : "venture capital & private equity firms"} | Baalvion`}
        description={
          `${total.toLocaleString()} ${facetName ? `${facetName.toLowerCase()} firms` : "venture capital and private equity firms"}` +
          `${placeName ? ` based in ${placeName}` : " worldwide"}, compiled from SEC Form D filings — what they raised, when they last filed, and who is named on each filing.`
        }
        path={here({ country, state, city })}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: scope,
          numberOfItems: total,
          isPartOf: { "@type": "WebSite", name: "Baalvion Insiders" },
        }}
      />

      <PageHeader
        eyebrow="Directory"
        title={facetName || placeName ? scope : "Investor directory"}
        lede="Venture capital and private equity firms compiled from SEC Form D filings — where they are, what they have raised, and when they last filed. Free to search."
        crumbs={crumbs}
        facts={loading && !data ? undefined : [
          { label: "Firms", value: total.toLocaleString() },
          { label: "Venture capital", value: (facets?.types.find((t) => t.value === "Venture Capital")?.n ?? 0).toLocaleString() },
          { label: "Private equity", value: (facets?.types.find((t) => t.value === "Private Equity")?.n ?? 0).toLocaleString() },
          { label: country ? "Cities" : "Countries", value: ((country ? data?.counts.cities : data?.counts.countries) ?? 0).toLocaleString() },
        ]}
      />

      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-6xl flex flex-col sm:flex-row gap-3">
          <form
            className="relative flex-1"
            onSubmit={(e) => { e.preventDefault(); setParam("q", draft.trim() || null); }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-11"
              placeholder="Search by firm, partner name or city"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Search investors"
            />
          </form>
          <Button variant="outline" className="h-11 lg:hidden" onClick={() => setMobileFilters((v) => !v)}>
            <SlidersHorizontal className="w-4 h-4 mr-2" />Filters
          </Button>
          <Link to="/directory" className="hidden sm:inline-flex">
            <Button variant="outline" className="h-11"><MapPin className="w-4 h-4 mr-2" />Browse by location</Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className={`w-full lg:w-64 shrink-0 ${mobileFilters ? "block" : "hidden lg:block"}`}>
            <div className="flex items-baseline justify-between pb-3 border-b border-foreground/80">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Refine</h2>
              {chips.length > 0 && (
                <button onClick={() => setParams(new URLSearchParams())} className="text-xs text-primary hover:underline">Clear all</button>
              )}
            </div>
            {facet ? (
              <div className="border-b border-border py-3">
                <div className="text-sm font-medium">Investor type</div>
                <p className="mt-2 text-sm">
                  <span className="font-semibold text-primary">{facetName}</span>{" "}
                  <Link to={placePath("investors", { country, state, city })} className="text-muted-foreground hover:text-primary hover:underline">· show all types</Link>
                </p>
              </div>
            ) : (
              <details open className="group border-b border-border py-3">
                <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                  <span className="text-sm font-medium">Investor type</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <ul className="mt-2.5 space-y-1.5">
                  {(facets?.types || []).map((o) => (
                    <li key={o.value}>
                      <Link to={facetPath("investors", o.value, { country, state, city })}
                        className="w-full flex items-baseline justify-between gap-3 text-left text-sm group/opt">
                        <span className="text-foreground/85 group-hover/opt:text-primary truncate">{o.value}</span>
                        <span className="text-xs tabular-nums text-muted-foreground shrink-0">{o.n.toLocaleString()}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {!country && <FacetGroup label="Country" options={facets?.countries || []} onPick={(v) => {
              const hit = (facets?.countries || []).find((c) => c.value === v);
              if (hit) window.location.assign(placePath("investors", { country: slugOf(hit.value) }));
            }} />}
            {country && !state && <FacetGroup label="State / region" options={facets?.states || []} onPick={(v) => {
              if (v) window.location.assign(placePath("investors", { country, state: slugOf(v) }));
            }} />}
            {!city && <FacetGroup label="City" options={facets?.cities || []} onPick={(v) => {
              if (v) window.location.assign(placePath("investors", { country: country || slugOf(rows.find((r) => r.city === v)?.country || ""), state: state || slugOf(rows.find((r) => r.city === v)?.state || "") || undefined, city: slugOf(v) }));
            }} />}
          </aside>

          <div className="flex-1 min-w-0">
            {people.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide pb-2 border-b border-foreground/80 flex items-center gap-2">
                  <Users className="w-4 h-4" />People matching "{q}"
                </h2>
                <ul className="rule-list">
                  {people.map((p, i) => (
                    <li key={`${p.side}-${p.entity_id}-${p.full_name}-${i}`}>
                      <Link
                        to={personPath(p.full_name)}
                        className="flex items-baseline justify-between gap-4 py-2.5 group"
                      >
                        <span className="text-sm">
                          <span className="font-medium">{p.full_name}</span>
                          <span className="text-muted-foreground"> · {(p.relationships || []).join(", ") || "named on filing"}</span>
                        </span>
                        <span className="text-sm text-primary group-hover:underline truncate max-w-[45%] text-right">{p.entity_name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-foreground/80">
              <p className="text-sm">
                <span className="font-semibold tabular-nums">{loading && !data ? "…" : total.toLocaleString()}</span>{" "}
                <span className="text-muted-foreground">firm{total === 1 ? "" : "s"}{placeName ? ` in ${placeName}` : ""}</span>
              </p>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setParam("sort", e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
            </div>

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                {chips.map((c) => (
                  <button key={c.label} onClick={c.clear}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs hover:border-primary">
                    <span className="text-muted-foreground">{c.label}:</span>{c.value}<X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="space-y-6 pt-6">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : failed ? (
              <p className="py-20 text-center text-muted-foreground">The directory could not be loaded. Please try again.</p>
            ) : rows.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="text-muted-foreground">No firms match this search.</p>
                <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>Clear filters</Button>
              </div>
            ) : (
              <>
                <ul className="rule-list">
                  {rows.map((i) => (
                    <li key={i.id}>
                      <Link to={investorPath(i)} className="group block py-5 -mx-3 px-3 hover:bg-secondary/60 transition-colors">
                        <div className="flex items-start justify-between gap-6">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-primary group-hover:underline flex items-center gap-1.5">
                              {i.name}
                              {i.is_verified && <BadgeCheck className="w-4 h-4 shrink-0" aria-label="Verified" />}
                            </h3>
                            <p className="text-sm mt-0.5 text-muted-foreground">
                              {i.firm_type}
                              {i.entity_type && <span> · {i.entity_type}</span>}
                              {i.year_founded ? <span> · formed {i.year_founded}</span> : null}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />{placeLabel(i as unknown as Investor)}
                            </p>
                          </div>

                          <div className="hidden sm:flex items-start gap-8 shrink-0 text-right">
                            <div>
                              <div className="label-eyebrow">Raised</div>
                              <div className="text-sm font-semibold mt-0.5 tabular-nums">{money(i.total_raised_usd)}</div>
                            </div>
                            <div>
                              <div className="label-eyebrow">Funds</div>
                              <div className="text-sm font-semibold mt-0.5 tabular-nums">{i.fund_count ?? 0}</div>
                            </div>
                            <div>
                              <div className="label-eyebrow">Last filing</div>
                              <div className="text-sm font-semibold mt-0.5 whitespace-nowrap">{fmtDate(i.last_filing_date)}</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-primary" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                {data && data.pages > 1 && (
                  <nav className="flex items-center justify-between gap-4 pt-6 mt-2 border-t border-border" aria-label="Pagination">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
                      <ChevronLeft className="w-4 h-4 mr-1" />Previous
                    </Button>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      Page {page.toLocaleString()} of {data.pages.toLocaleString()}
                    </span>
                    <Button variant="outline" disabled={page >= data.pages} onClick={() => setParam("page", String(page + 1))}>
                      Next<ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

const slugOf = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
