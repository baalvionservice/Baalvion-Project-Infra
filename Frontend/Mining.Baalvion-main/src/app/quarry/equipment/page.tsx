import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";
import { Cog, Drill, Shovel, Scissors, Layers, Truck, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quarry Equipment",
  description:
    "Baalvion Mining's quarry equipment and machinery categories — drilling, excavation, crushing, screening, and haulage fleet classes used across our operations.",
  alternates: { canonical: "https://mining.baalvion.com/quarry/equipment" },
};

const equipmentCategories = [
  {
    icon: Drill,
    title: "Drilling",
    description:
      "Drill rigs and supporting equipment used to prepare the working face for controlled extraction.",
  },
  {
    icon: Shovel,
    title: "Excavation",
    description:
      "Excavators and loaders for winning and moving material from the face into the processing chain.",
  },
  {
    icon: Scissors,
    title: "Crushing",
    description:
      "Primary and secondary crushers that reduce run-of-quarry rock into workable fractions.",
  },
  {
    icon: Layers,
    title: "Screening",
    description:
      "Screens and classifiers that separate crushed material into defined product gradings.",
  },
  {
    icon: Truck,
    title: "Haulage",
    description:
      "Haul trucks and material-handling equipment that move product through stockpiling and dispatch.",
  },
];

export default function QuarryEquipmentPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <Cog className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Quarry Operations
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Equipment &amp; Machinery
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Our quarry operations are supported by purpose-selected equipment
              across the full production chain — maintained and operated to
              manufacturer and safety standards.
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

          <section aria-labelledby="equipment-categories" className="space-y-6">
            <h2
              id="equipment-categories"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Equipment Categories
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              The categories below describe the classes of machinery used across
              our operations. Specific fleet composition, counts, and
              manufacturer detail are published as they are formally disclosed.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {equipmentCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.title} className="border-none shadow-sm">
                    <CardHeader>
                      <div className="p-3 rounded-xl bg-primary/5 w-fit mb-2">
                        <Icon
                          className="h-6 w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <PendingDisclosure label="Specific fleet composition, equipment counts, and manufacturer detail." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
