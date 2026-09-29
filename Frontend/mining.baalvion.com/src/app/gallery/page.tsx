import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Info } from "lucide-react";
import Image from "next/image";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A visual showcase of our operations, facilities, and minerals. Final photography is pending company disclosure.",
  alternates: { canonical: "https://mining.baalvion.com/gallery" },
};

function PendingDisclosure({ label }: { label?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-6 flex items-start gap-3 text-slate-500">
      <Info className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-slate-600">
          Information pending company disclosure.
        </p>
        {label ? <p className="text-xs text-slate-400 mt-1">{label}</p> : null}
      </div>
    </div>
  );
}

const tiles = [
  {
    key: "company" as const,
    category: "Operations & Facilities",
  },
  {
    key: "mineral" as const,
    category: "Mineral Samples",
  },
  {
    key: "logistics" as const,
    category: "Logistics & Transport",
  },
  {
    key: "globalNetwork" as const,
    category: "Site & Network",
  },
  {
    key: "company" as const,
    category: "Corporate",
  },
  {
    key: "mineral" as const,
    category: "Processing",
  },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <ImageIcon className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Gallery
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Our Operations in Pictures
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              A visual showcase of Baalvion Mining Inc. — our operations,
              facilities, minerals, and people. Official photography is being
              prepared and will be published here in due course.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-10">
          <section aria-labelledby="gallery-intro" className="space-y-4">
            <h2
              id="gallery-intro"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Visual Showcase
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              The tiles below are branded placeholders, not photographs of real
              sites or assets. They indicate the categories of imagery that will
              feature in this gallery once final, licensed photography is
              released.
            </p>
            <PendingDisclosure label="Final photography of sites, facilities, equipment, minerals, and people." />
          </section>

          <section aria-labelledby="gallery-grid" className="space-y-6">
            <h2 id="gallery-grid" className="sr-only">
              Gallery placeholders
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tiles.map((tile, idx) => (
                <Card
                  key={`${tile.key}-${idx}`}
                  className="border-none shadow-sm overflow-hidden group"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={BRAND_IMAGES[tile.key]}
                      alt={`Branded placeholder for ${tile.category}. Imagery pending company disclosure.`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {tile.category}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Imagery pending company disclosure
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
