import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import PageSeo from "@/components/seo/PageSeo";
import PageHeader from "@/components/directory/PageHeader";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight } from "lucide-react";
import { listPlaces, type Places, type CountryNode } from "@/lib/publicApi";
import { placePath } from "@/lib/directory-url";

// A place appears here only if something is actually listed in it. Offering an empty
// "Investors in Wyoming" page would be a thin page for Google and a dead end for a founder.
const Count = ({ investors, founders }: { investors: number; founders: number }) => (
  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
    {investors > 0 && `${investors} investor${investors === 1 ? "" : "s"}`}
    {investors > 0 && founders > 0 && " · "}
    {founders > 0 && `${founders} compan${founders === 1 ? "y" : "ies"}`}
  </span>
);

function CountryBlock({ c, query }: { c: CountryNode; query: string }) {
  const q = query.trim().toLowerCase();
  const hit = (s: string) => !q || s.toLowerCase().includes(q);

  const states = c.states
    .map((st) => ({ ...st, cities: st.cities.filter((ci) => hit(ci.name) || hit(st.name) || hit(c.name)) }))
    .filter((st) => hit(st.name) || hit(c.name) || st.cities.length);
  const cities = c.cities.filter((ci) => hit(ci.name) || hit(c.name));
  if (q && !hit(c.name) && !states.length && !cities.length) return null;

  return (
    <section className="py-7">
      <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-foreground/80">
        <h2 className="text-xl font-semibold">
          <Link to={placePath("investors", { country: c.slug })} className="hover:text-primary hover:underline">{c.name}</Link>
        </h2>
        <Count investors={c.investors} founders={c.founders} />
      </div>

      {states.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6 mt-5">
          {states.map((st) => (
            <div key={st.slug}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  <Link to={placePath("investors", { country: c.slug, state: st.slug })} className="hover:text-primary hover:underline">{st.name}</Link>
                </h3>
                <Count investors={st.investors} founders={st.founders} />
              </div>
              <ul className="mt-1.5 space-y-1">
                {st.cities.map((ci) => (
                  <li key={ci.slug} className="flex items-baseline justify-between gap-3">
                    <Link
                      to={placePath("investors", { country: c.slug, state: st.slug, city: ci.slug })}
                      className="text-sm text-primary hover:underline"
                    >
                      {ci.name}
                    </Link>
                    <Count investors={ci.investors} founders={ci.founders} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {cities.length > 0 && (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-1.5 mt-5">
          {cities.map((ci) => (
            <li key={ci.slug} className="flex items-baseline justify-between gap-3">
              <Link to={placePath("investors", { country: c.slug, city: ci.slug })} className="text-sm text-primary hover:underline">{ci.name}</Link>
              <Count investors={ci.investors} founders={ci.founders} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DirectoryHub() {
  const [places, setPlaces] = useState<Places | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listPlaces().then(setPlaces).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, []);

  const totals = places?.totals;
  const countries = useMemo(() => places?.countries || [], [places]);

  return (
    <MainLayout>
      <PageSeo
        title="Browse Investors & Companies by Country, State and City | Baalvion"
        description="The full geographic index of the Baalvion network — every country, state and city with investors or companies listed, with counts."
        path="/directory"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Directory by location",
          isPartOf: { "@type": "WebSite", name: "Baalvion Insiders" },
        }}
      />

      <PageHeader
        eyebrow="Directory"
        title="Browse by location"
        lede="Every country, state and city where the network has someone listed. Counts come from live records — a place appears here only when there is something in it."
        crumbs={[{ label: "Home", to: "/" }, { label: "Browse by location" }]}
        facts={totals ? [
          { label: "Countries", value: String(totals.countries) },
          { label: "Cities", value: String(totals.cities) },
          { label: "Investors", value: String(totals.investors) },
          { label: "Companies", value: String(totals.founders) },
        ] : undefined}
      />

      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-11" placeholder="Find a country, state or city" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search locations" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-6xl">
        {loading ? (
          <div className="space-y-8 pt-8">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
        ) : failed ? (
          <p className="py-20 text-center text-muted-foreground">Locations could not be loaded. Please try again.</p>
        ) : countries.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No locations yet — they appear as investors and companies are added.</p>
        ) : (
          <div className="divide-y divide-border">
            {countries.map((c) => <CountryBlock key={c.slug} c={c} query={query} />)}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-6">
          <Link to="/investors" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            All investors <ChevronRight className="w-4 h-4" />
          </Link>
          <Link to="/founders" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            All companies <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
