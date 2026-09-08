import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import PageSeo from "@/components/seo/PageSeo";
import PageHeader from "@/components/directory/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, MapPin, ChevronRight, Briefcase, Building2, Users } from "lucide-react";
import {
  listPublicInvestors, listPublicCompanies, searchPeople,
  type PublicInvestor, type PublicCompany, type PersonHit,
} from "@/lib/publicApi";
import { money, placeLabel, type Investor } from "@/lib/investor";
import { founderPath, investorPath, personPath } from "@/lib/directory-url";

// One box, all three record types. The header search previously rendered an input with no handler
// at all — it looked like a search and did nothing on every page of the site.
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [draft, setDraft] = useState(q);
  const [investors, setInvestors] = useState<PublicInvestor[]>([]);
  const [companies, setCompanies] = useState<PublicCompany[]>([]);
  const [people, setPeople] = useState<PersonHit[]>([]);
  const [totals, setTotals] = useState({ investors: 0, companies: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { setDraft(q); }, [q]);

  useEffect(() => {
    if (!q.trim()) { setInvestors([]); setCompanies([]); setPeople([]); return; }
    setLoading(true);
    Promise.all([
      listPublicInvestors({ q, limit: 5 }).catch(() => null),
      listPublicCompanies({ q, limit: 5 }).catch(() => null),
      searchPeople(q, 10).catch(() => []),
    ]).then(([inv, co, ppl]) => {
      setInvestors(inv?.investors || []);
      setCompanies(co?.companies || []);
      setPeople(ppl);
      setTotals({ investors: inv?.total || 0, companies: co?.total || 0 });
    }).finally(() => setLoading(false));
  }, [q]);

  const empty = !loading && q && !investors.length && !companies.length && !people.length;

  const Section = ({ icon: Icon, title, count, all, children }: {
    icon: typeof Briefcase; title: string; count: number; all?: string; children: React.ReactNode;
  }) => (
    <section className="mb-10">
      <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-foreground/80">
        <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
          <Icon className="w-4 h-4" />{title}
          <span className="text-muted-foreground font-normal normal-case tracking-normal">{count.toLocaleString()}</span>
        </h2>
        {all && count > 0 && <Link to={all} className="text-sm text-primary hover:underline whitespace-nowrap">See all</Link>}
      </div>
      {children}
    </section>
  );

  return (
    <MainLayout>
      <PageSeo
        title={q ? `Search: ${q} | Baalvion` : "Search investors, companies and people | Baalvion"}
        description="Search investment firms, companies and the people named on their public filings."
        path="/search"
        noIndex
      />

      <PageHeader
        eyebrow="Search"
        title={q ? `Results for "${q}"` : "Search"}
        lede="Investment firms, companies and the people named on their filings — all in one place."
        crumbs={[{ label: "Home", to: "/" }, { label: "Search" }]}
      />

      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <form
            className="relative max-w-2xl"
            onSubmit={(e) => { e.preventDefault(); setParams(draft.trim() ? { q: draft.trim() } : {}); }}
          >
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-11" placeholder="Firm, company, or person's name" value={draft}
              onChange={(e) => setDraft(e.target.value)} aria-label="Search everything" autoFocus />
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!q ? (
          <p className="py-16 text-center text-muted-foreground">Type a name to search the directory.</p>
        ) : loading ? (
          <div className="space-y-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : empty ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-muted-foreground">Nothing matches “{q}”.</p>
            <Button variant="outline" asChild><Link to="/investors">Browse all investors</Link></Button>
          </div>
        ) : (
          <>
            {investors.length > 0 && (
              <Section icon={Briefcase} title="Investment firms" count={totals.investors} all={`/investors?q=${encodeURIComponent(q)}`}>
                <ul className="rule-list">
                  {investors.map((i) => (
                    <li key={i.id}>
                      <Link to={investorPath(i)} className="group flex items-start justify-between gap-6 py-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-primary group-hover:underline">{i.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{i.firm_type}</p>
                          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />{placeLabel(i as unknown as Investor)}
                          </p>
                        </div>
                        <div className="hidden sm:flex gap-8 shrink-0 text-right">
                          <div><div className="label-eyebrow">Raised</div><div className="text-sm font-semibold mt-0.5 tabular-nums">{money(i.total_raised_usd)}</div></div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-primary" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {companies.length > 0 && (
              <Section icon={Building2} title="Companies" count={totals.companies} all={`/founders?q=${encodeURIComponent(q)}`}>
                <ul className="rule-list">
                  {companies.map((c) => (
                    <li key={c.id}>
                      <Link to={founderPath(c)} className="group flex items-start justify-between gap-6 py-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-primary group-hover:underline">{c.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{c.industry_group || "Sector not stated"}</p>
                          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />{[c.city, c.state, c.country].filter(Boolean).join(", ") || "—"}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-primary hidden sm:block" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {people.length > 0 && (
              <Section icon={Users} title="People" count={people.length}>
                <ul className="rule-list">
                  {people.map((p, i) => (
                    <li key={`${p.side}-${p.entity_id}-${i}`}>
                      <Link to={personPath(p.full_name)} className="group flex items-baseline justify-between gap-4 py-3">
                        <span className="text-sm">
                          <span className="font-medium text-primary group-hover:underline">{p.full_name}</span>
                          <span className="text-muted-foreground"> · {(p.relationships || []).join(", ") || "named on filing"}</span>
                        </span>
                        <span className="text-sm text-muted-foreground truncate max-w-[45%] text-right">{p.entity_name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
