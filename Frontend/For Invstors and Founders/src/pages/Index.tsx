import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Search, MapPin, ShieldCheck, ChevronRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MainLayout from "@/components/layout/MainLayout";
import PageSeo from "@/components/seo/PageSeo";
import { listPlaces, listPublicInvestors, type Places, type PublicInvestor } from "@/lib/publicApi";
import { investorPath, placePath } from "@/lib/directory-url";
import { irBusinessOnboardingUrl } from "@/lib/ir";
import { money, placeLabel, type Investor } from "@/lib/investor";

// Every number on this page is counted from live records. Nothing here is illustrative: a
// directory that inflates its own size is the first thing a founder checks and the last thing
// they forgive.
const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Places | null>(null);
  const [recent, setRecent] = useState<PublicInvestor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listPlaces().catch(() => null),
      listPublicInvestors({ sort: "recent", limit: 6 }).catch(() => null),
    ])
      .then(([p, inv]) => { setPlaces(p); setRecent(inv?.investors || []); })
      .finally(() => setLoading(false));
  }, []);

  const totals = places?.totals;
  const topPlaces = (places?.countries || []).flatMap((c) => [
    ...c.states.flatMap((st) => st.cities.map((ci) => ({ ...ci, to: placePath("investors", { country: c.slug, state: st.slug, city: ci.slug }), country: c.name }))),
    ...c.cities.map((ci) => ({ ...ci, to: placePath("investors", { country: c.slug, city: ci.slug }), country: c.name })),
  ]).sort((a, b) => b.investors - a.investors).slice(0, 12);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/investors${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  return (
    <MainLayout>
      <PageSeo
        title="Baalvion Insiders — Find Active Investors by Sector, Stage and Location"
        description="A free, searchable directory of active investors and the companies raising from them. Filter by country, city, stage, sector and cheque size."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Baalvion Insiders",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.marketunderworld.com/investors?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />

      {/* Hero — the search box is the product, so it is the thing on the panel. */}
      <section className="border-b border-border bg-secondary/50">
        <div className="container mx-auto px-4 py-16 lg:py-24 max-w-6xl">
          <div className="max-w-3xl">
            <div className="label-eyebrow mb-3">Investor directory</div>
            <h1 className="text-4xl lg:text-6xl font-semibold leading-[1.05]">
              Find the investors who fund<br className="hidden sm:block" /> companies like yours.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Search active funds, angels, family offices and corporate investors by sector, stage,
              cheque size and location. Free to search, no account needed.
            </p>

            <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-10 h-13 bg-background text-base"
                  style={{ height: "3.25rem" }}
                  placeholder="Sector, firm, or investor name"
                  aria-label="Search investors"
                />
              </div>
              <Button type="submit" size="lg" className="h-13" style={{ height: "3.25rem" }}>
                Search investors<ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>

            {totals && (
              <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
                {[
                  ["Investors listed", totals.investors],
                  ["Countries", totals.countries],
                  ["Cities", totals.cities],
                  ["Companies", totals.founders],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="label-eyebrow">{label}</dt>
                    <dd className="text-2xl font-semibold mt-1 tabular-nums">{value as number}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* Places */}
      <section className="container mx-auto px-4 py-14 max-w-6xl">
        <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-foreground/80">
          <h2 className="text-2xl font-semibold">Investors by location</h2>
          <Link to="/directory" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
            All locations <ChevronRight className="w-4 h-4 inline -mt-0.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : topPlaces.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Locations appear here as investors are added.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 mt-2 rule-list-none">
            {topPlaces.map((p) => (
              <li key={p.to} className="border-b border-border">
                <Link to={p.to} className="flex items-baseline justify-between gap-3 py-3 group">
                  <span className="text-sm">
                    <span className="font-medium text-primary group-hover:underline">{p.name}</span>
                    <span className="text-muted-foreground"> · {p.country}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {p.investors} investor{p.investors === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recently listed */}
      <section className="border-t border-border bg-secondary/40">
        <div className="container mx-auto px-4 py-14 max-w-6xl">
          <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-foreground/80">
            <h2 className="text-2xl font-semibold">Most recent filings</h2>
            <Link to="/investors" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
              All investors <ChevronRight className="w-4 h-4 inline -mt-0.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4 mt-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : recent.length === 0 ? (
            <p className="mt-6 text-muted-foreground">No investors listed yet.</p>
          ) : (
            <ul className="rule-list">
              {recent.map((i) => (
                <li key={i.id}>
                  <Link to={investorPath(i)} className="group flex items-start justify-between gap-6 py-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-primary group-hover:underline flex items-center gap-1.5">
                        {i.name}{i.is_verified && <BadgeCheck className="w-4 h-4 shrink-0" aria-label="Verified" />}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {i.firm_type} — {placeLabel(i as unknown as Investor)}
                      </p>
                    </div>
                    <div className="hidden sm:flex gap-8 shrink-0 text-right">
                      <div><div className="label-eyebrow">Raised</div><div className="text-sm font-semibold mt-0.5 whitespace-nowrap tabular-nums">{money(i.total_raised_usd)}</div></div>
                      <div><div className="label-eyebrow">Funds</div><div className="text-sm font-semibold mt-0.5 tabular-nums">{i.fund_count ?? 0}</div></div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-14 max-w-6xl">
        <h2 className="text-2xl font-semibold pb-3 border-b border-foreground/80">How it works</h2>
        <ol className="grid md:grid-cols-3 gap-8 mt-8">
          {[
            { n: "01", t: "Search the directory", d: "Filter by the things that decide fit — stage, sector, cheque size and where an investor is based. No account, no paywall." },
            { n: "02", t: "Read the full profile", d: "Thesis, focus sectors, stages, typical cheque, assets under management and the investments we can source publicly." },
            { n: "03", t: "Submit your company", d: "Take it to Baalvion IR, where the raise is actually run — KYC review, then commitments, capital calls and shareholder reporting." },
          ].map((s) => (
            <li key={s.n}>
              <div className="text-sm font-semibold text-primary tabular-nums">{s.n}</div>
              <h3 className="text-lg font-semibold mt-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Fees notice — advance-fee fraud is endemic wherever founders are promised investor access. */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex gap-4 max-w-3xl">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold">We never charge a founder to be introduced to an investor</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Searching the directory and requesting an introduction are free. Nobody acting for Baalvion
                will ask you for a success fee, a listing fee, a deposit or a payment to "unlock" an investor.
                If someone does, it is not us — please report it.
              </p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Investor profiles are compiled from public sources and from what investors tell us. Nothing
                here is investment advice or an offer, and we make no claim about returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/50">
        <div className="container mx-auto px-4 py-14 max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold">Raising a round?</h2>
            <p className="text-muted-foreground mt-1.5 max-w-xl">
              Submit your company to Baalvion IR. It goes through KYC and compliance review, and if it
              proceeds the raise is run there — commitments, capital calls and shareholder reporting.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <a href={irBusinessOnboardingUrl("home")} target="_blank" rel="noreferrer">Submit your company<ArrowRight className="ml-2 w-4 h-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline"><Link to="/directory"><MapPin className="w-4 h-4 mr-2" />Browse by location</Link></Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
