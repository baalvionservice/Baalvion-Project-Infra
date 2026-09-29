import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Mountain,
  Layers,
  ShieldCheck,
  Leaf,
  Building2,
  MapPin,
  Compass,
  HardHat,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { getMineSites, companyFacts } from "@/lib/content/store";
import { PendingDisclosure, EmptyState } from "@/components/common/PendingDisclosure";

export const metadata: Metadata = {
  title: "Mine Sites & Portfolio",
  description:
    "Baalvion Mining Inc.'s approach to responsible mine and site development. Site-level disclosures — locations, reserves and production — are published only as released by management.",
  alternates: { canonical: "https://mining.baalvion.com/mine-sites" },
  openGraph: {
    title: "Mine Sites & Portfolio",
    description:
      "Our approach to responsible mine and site development. Site disclosures are published as released by management.",
    url: "https://mining.baalvion.com/mine-sites",
    siteName: "Baalvion Mining Inc.",
  },
};

// Generic mineral CATEGORIES we are equipped to handle — these are
// capability classes, NOT claims about specific reserves, grades or output.
const MINERAL_CATEGORIES = [
  "Industrial minerals",
  "Construction aggregates",
  "Dimension & decorative stone",
  "Base & specialty metals concentrates",
  "Bulk commodities",
];

const DEVELOPMENT_APPROACH = [
  {
    icon: <Compass className="h-7 w-7 text-secondary" />,
    title: "Disciplined Site Selection",
    description:
      "Sites are evaluated against geological, legal, environmental and community criteria before any commitment is made.",
  },
  {
    icon: <ShieldCheck className="h-7 w-7 text-secondary" />,
    title: "Compliance-First Development",
    description:
      "Statutory approvals, permits and clearances are secured and maintained as a precondition of operating, not an afterthought.",
  },
  {
    icon: <Leaf className="h-7 w-7 text-secondary" />,
    title: "Environmental Stewardship",
    description:
      "Progressive rehabilitation, water management and impact monitoring are designed into the development plan.",
  },
  {
    icon: <HardHat className="h-7 w-7 text-secondary" />,
    title: "Safety & Community",
    description:
      "Worker safety and engagement with host communities are treated as core operating standards across the life of a site.",
  },
];

export default async function MineSitesPage() {
  const sites = await getMineSites();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
            <Mountain className="h-64 w-64" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Mine & Site Portfolio
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
              Mine Sites
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Our approach to responsible mine and site development across the
              mineral categories we serve. Individual site disclosures are
              published as they are released by management.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-12 space-y-16">
          {/* Approach to mine development */}
          <section className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Our Approach to Mine Development
              </h2>
              <p className="text-secondary leading-relaxed">
                We develop and operate within a framework that puts compliance,
                environmental management and safety ahead of pace.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {DEVELOPMENT_APPROACH.map((item) => (
                <Card key={item.title} className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 rounded-2xl bg-secondary/10 w-fit">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Mineral categories handled */}
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/5">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  Mineral Categories Handled
                </h2>
              </div>
              <p className="text-secondary leading-relaxed">
                We are equipped to handle the following categories of minerals
                and materials. These are capability classes only — specific
                grades, reserves and production figures are disclosed per site
                once released.
              </p>
              <div className="flex flex-wrap gap-3">
                {MINERAL_CATEGORIES.map((category) => (
                  <span
                    key={category}
                    className="px-4 py-2 bg-primary/5 text-primary rounded-full text-sm font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
              <PendingDisclosure label="Specific reserves, grades and production data are published per site as released by management." />
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
              <Image
                src={BRAND_IMAGES.mineral}
                alt="Representative mineral and aggregate materials handled by Baalvion Mining"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </section>

          {/* Site list */}
          <section className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Site Portfolio
              </h2>
              <p className="text-secondary leading-relaxed">
                Operating and development sites appear here as their disclosures
                are published.
              </p>
            </div>

            {sites.length === 0 ? (
              <EmptyState
                title="Mine site disclosures pending"
                message="Site-level details, including locations, reserves and production, are published as released by management."
                ctaHref="/contact"
                ctaLabel="Enquire"
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sites.map((site) => (
                  <Card
                    key={site.id}
                    className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={site.gallery[0]?.url ?? BRAND_IMAGES.mineral}
                        alt={site.gallery[0]?.alt ?? site.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <h3 className="text-lg font-bold text-slate-900">
                        {site.name}
                      </h3>
                      {site.minerals.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {site.minerals.map((mineral) => (
                            <span
                              key={mineral}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium"
                            >
                              {mineral}
                            </span>
                          ))}
                        </div>
                      )}
                      {site.productionCapacity ? (
                        <p className="text-sm text-slate-500">
                          Capacity: {site.productionCapacity}
                        </p>
                      ) : (
                        <PendingDisclosure label="Production data pending disclosure." />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Office locations strip (real, verified facts) */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/5">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Our Offices
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                    Headquarters
                  </Badge>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {companyFacts.headquarters}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Registered Office
                  </Badge>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {companyFacts.registeredOffice}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center pt-2">
              <Link href="/contact">
                <Button className="font-bold h-12 px-10">Enquire About Our Sites</Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
