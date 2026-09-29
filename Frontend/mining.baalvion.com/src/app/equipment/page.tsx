import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Cog,
  Drill,
  Shovel,
  Boxes,
  Hammer,
  Filter as FilterIcon,
  Truck,
  CheckCircle2,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { getEquipment } from "@/lib/content/store";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";

export const metadata: Metadata = {
  title: "Equipment & Fleet",
  description:
    "An overview of the equipment and fleet capability categories Baalvion Mining Inc. operates across drilling, excavation, loading, crushing, screening and haulage. Specific models and counts are disclosed as released.",
  alternates: { canonical: "https://mining.baalvion.com/equipment" },
  openGraph: {
    title: "Equipment & Fleet",
    description:
      "Equipment and fleet capability categories across drilling, excavation, loading, crushing, screening and haulage.",
    url: "https://mining.baalvion.com/equipment",
    siteName: "Baalvion Mining Inc.",
  },
};

// Capability CATEGORIES only — no fabricated models, specs or unit counts.
const CAPABILITY_CATEGORIES = [
  {
    icon: <Drill className="h-7 w-7 text-secondary" />,
    title: "Drilling",
    description:
      "Drilling capability for exploration, blast-hole patterns and sampling across varied ground conditions.",
  },
  {
    icon: <Shovel className="h-7 w-7 text-secondary" />,
    title: "Excavation",
    description:
      "Excavation and earthmoving capability for overburden removal, benching and bulk material movement.",
  },
  {
    icon: <Boxes className="h-7 w-7 text-secondary" />,
    title: "Loading",
    description:
      "Loading capability to move extracted material efficiently into haulage and processing streams.",
  },
  {
    icon: <Hammer className="h-7 w-7 text-secondary" />,
    title: "Crushing",
    description:
      "Crushing capability to reduce run-of-mine material to required size fractions for downstream use.",
  },
  {
    icon: <FilterIcon className="h-7 w-7 text-secondary" />,
    title: "Screening",
    description:
      "Screening and classification capability to separate processed material into graded product streams.",
  },
  {
    icon: <Truck className="h-7 w-7 text-secondary" />,
    title: "Haulage",
    description:
      "Haulage capability for the safe, efficient movement of bulk material from face to stockpile and quayside.",
  },
];

export default async function EquipmentPage() {
  const equipment = await getEquipment();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
            <Cog className="h-64 w-64" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Equipment & Fleet
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
              Equipment & Fleet Capability
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Our operating capability spans the full mine-to-product chain.
              Specific machine models, specifications and unit counts are
              disclosed as they are released by management.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-12 space-y-16">
          {/* Capability categories */}
          <section className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Capability by Category
              </h2>
              <p className="text-secondary leading-relaxed">
                Each category below describes a class of operating capability,
                not a specific make or model.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CAPABILITY_CATEGORIES.map((category) => (
                <Card key={category.title} className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 rounded-2xl bg-secondary/10 w-fit">
                      {category.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {category.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Real fleet (store) or pending */}
          <section className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                Our Fleet
              </h2>
              <p className="text-secondary leading-relaxed">
                Detailed fleet listings — with verified models and quantities —
                are published here as released by management.
              </p>
              {equipment.length === 0 ? (
                <PendingDisclosure label="Fleet inventory, including specific models and counts, is pending company disclosure." />
              ) : (
                <div className="grid gap-4">
                  {equipment.map((item) => (
                    <Card key={item.id} className="border-none shadow-sm">
                      <CardContent className="p-5 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-bold text-slate-900">
                            {item.name}
                          </h3>
                          <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                            {item.category}
                          </Badge>
                        </div>
                        {item.description ? (
                          <p className="text-sm text-slate-500 leading-relaxed">
                            {item.description}
                          </p>
                        ) : (
                          <PendingDisclosure label="Specifications pending disclosure." />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
              <Image
                src={BRAND_IMAGES.logistics}
                alt="Representative mining and materials handling operations"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </section>

          {/* Standards strip */}
          <section className="rounded-2xl bg-slate-50 border border-slate-100 p-8 md:p-10 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-secondary" />
              <h2 className="text-xl md:text-2xl font-bold text-primary">
                Maintained to Operating Standards
              </h2>
            </div>
            <p className="text-secondary leading-relaxed max-w-3xl">
              Equipment is operated and maintained against safety, environmental
              and reliability standards appropriate to the work. Verified
              utilisation and performance metrics are disclosed as released.
            </p>
            <div className="pt-2">
              <Link href="/contact">
                <Button className="font-bold h-12 px-10">
                  Discuss Our Capability
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
