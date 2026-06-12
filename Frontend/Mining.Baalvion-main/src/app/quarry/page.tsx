import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PendingDisclosure,
  EmptyState,
} from "@/components/common/PendingDisclosure";
import { getQuarrySites, companyFacts } from "@/lib/content/store";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import {
  Mountain,
  HardHat,
  Leaf,
  Sprout,
  Cog,
  MapPin,
  Gauge,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quarry Operations",
  description:
    "Baalvion Mining's quarry operations — extraction, processing, site management, equipment, safety, environmental stewardship, and progressive rehabilitation across our quarry portfolio.",
  alternates: { canonical: "https://mining.baalvion.com/quarry" },
};

const capabilityLinks = [
  {
    href: "/quarry/locations",
    icon: MapPin,
    title: "Locations",
    description:
      "How our quarry sites and operational offices are organised across the regions we serve.",
  },
  {
    href: "/quarry/capabilities",
    icon: Cog,
    title: "Capabilities",
    description:
      "Extraction, processing, crushing, screening, and custom sizing capability categories.",
  },
  {
    href: "/quarry/production",
    icon: Gauge,
    title: "Production",
    description:
      "Our production approach and the stages that move raw rock to specification-ready material.",
  },
  {
    href: "/quarry/equipment",
    icon: Mountain,
    title: "Equipment",
    description:
      "The categories of machinery used across drilling, excavation, crushing, screening, and haulage.",
  },
  {
    href: "/quarry/safety",
    icon: HardHat,
    title: "Safety",
    description:
      "Our zero-harm commitment, training programs, and incident-reporting framework.",
  },
  {
    href: "/quarry/environmental",
    icon: Leaf,
    title: "Environmental",
    description:
      "Dust, water, and noise management, biodiversity protection, and ongoing monitoring.",
  },
  {
    href: "/quarry/rehabilitation",
    icon: Sprout,
    title: "Rehabilitation",
    description:
      "Progressive rehabilitation, closure planning, and responsible post-mining land use.",
  },
];

export default async function QuarryOverviewPage() {
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
            <Mountain className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Quarry Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Aggregates &amp; Dimensional Stone, Responsibly Quarried
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              {companyFacts.brand} develops quarry operations around a simple
              priority order: people first, environment always, and quality at
              every stage. This is the home for how we extract, process, and
              steward the land we work.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-16">
          <section aria-labelledby="quarry-intro" className="space-y-6">
            <div className="flex items-center gap-3">
              <Mountain className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="quarry-intro"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Our Approach to Quarrying
              </h2>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Quarrying supplies the foundational materials of modern
                  infrastructure — aggregates, crushed stone, and sized
                  products used across construction, roads, and industry. We
                  approach every site as a long-term commitment: planned,
                  permitted, and operated to recognised safety and
                  environmental standards.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Our operating model integrates extraction discipline,
                  processing quality control, and progressive rehabilitation
                  from day one — so the land we work is returned to productive,
                  beneficial use. Specific sites, capacities, and metrics are
                  published as they are formally disclosed by management.
                </p>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-sm">
                <Image
                  src={BRAND_IMAGES.company}
                  alt="Baalvion Mining quarry operations overview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="quarry-capabilities" className="space-y-6">
            <div className="flex items-center gap-3">
              <Cog className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="quarry-capabilities"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Explore Our Quarry Operations
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Each area below covers a different dimension of how we run our
              quarry operations responsibly.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {capabilityLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                  >
                    <Card className="h-full border-none shadow-sm transition-shadow group-hover:shadow-md">
                      <CardHeader>
                        <div className="p-3 rounded-xl bg-primary/5 w-fit mb-2">
                          <Icon
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <CardTitle className="text-lg flex items-center justify-between">
                          {link.title}
                          <ArrowRight
                            className="h-4 w-4 text-primary opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                            aria-hidden="true"
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {link.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="quarry-sites" className="space-y-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="quarry-sites"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Our Quarry Sites
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
                    <CardHeader>
                      <CardTitle className="text-lg">{site.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
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

          <section
            aria-labelledby="quarry-cta"
            className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 max-w-2xl">
                <h2
                  id="quarry-cta"
                  className="text-2xl md:text-3xl font-bold"
                >
                  Partner with us on quarry supply
                </h2>
                <p className="text-primary-foreground/70 leading-relaxed">
                  For product enquiries, supply discussions, or operational
                  partnership, our team is ready to talk.
                </p>
              </div>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="shrink-0"
              >
                <Link href="/contact">Get in touch</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
