import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/PendingDisclosure";
import { getQuarrySites, companyFacts } from "@/lib/content/store";
import { MapPin, Building2, Landmark, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quarry Locations",
  description:
    "How Baalvion Mining organises its quarry sites and corporate offices — including our headquarters and registered office in India.",
  alternates: { canonical: "https://mining.baalvion.com/quarry/locations" },
};

const offices = [
  {
    icon: Building2,
    label: "Headquarters",
    address: companyFacts.headquarters,
  },
  {
    icon: Landmark,
    label: "Registered Office",
    address: companyFacts.registeredOffice,
  },
];

export default async function QuarryLocationsPage() {
  const sites = await getQuarrySites();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <MapPin className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Quarry Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Locations &amp; Site Network
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Our quarry operations are organised around proximity to resource,
              market, and transport infrastructure — supported by our corporate
              offices in India.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-16">
          <Link
            href="/quarry"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Quarry Operations
          </Link>

          <section aria-labelledby="how-organised" className="space-y-6">
            <h2
              id="how-organised"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              How Our Sites Are Organised
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Quarry sites are selected and developed based on geological
              suitability, regulatory approval, environmental sensitivity, and
              access to markets and logistics. Each site operates under its own
              permits and management plans while sharing common safety,
              environmental, and quality standards across the portfolio.
            </p>
          </section>

          <section aria-labelledby="site-list" className="space-y-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="site-list"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Quarry Sites
              </h2>
            </div>
            {sites.length === 0 ? (
              <EmptyState
                title="Quarry sites pending disclosure"
                message="Detailed quarry site information will be published as it is released by management."
                ctaHref="/contact"
                ctaLabel="Enquire about our quarry operations"
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sites.map((site) => (
                  <Card key={site.id} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <h3 className="text-base font-bold text-slate-900">
                        {site.name}
                      </h3>
                      {site.description ? (
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {site.description}
                        </p>
                      ) : null}
                      {site.materials.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {site.materials.map((material) => (
                            <Badge key={material} variant="secondary">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="offices" className="space-y-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="offices"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Corporate Offices
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {offices.map((office) => {
                const Icon = office.icon;
                return (
                  <Card key={office.label} className="border-none shadow-sm">
                    <CardContent className="p-6 space-y-3">
                      <div className="p-3 rounded-xl bg-primary/5 w-fit">
                        <Icon
                          className="h-6 w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {office.label}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {office.address}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
