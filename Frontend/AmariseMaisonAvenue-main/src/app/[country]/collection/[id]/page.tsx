"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { COLLECTIONS, PRODUCTS } from "@/lib/mock-data";
import { ProductCard } from "@/components/product/ProductCard";
import { generateCollectionNarrative } from "@/ai/flows/generate-collection-narrative";
import { ChevronRight, Filter, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CollectionPage() {
  const { id, country } = useParams();
  const countryCode = (country as string) || "us";
  const collection = COLLECTIONS.find((c) => c.id === id);

  const [narrative, setNarrative] = useState<string | null>(null);
  const [loadingNarrative, setLoadingNarrative] = useState(true);

  const collectionProducts = PRODUCTS.filter((p) => p.collectionId === id);

  useEffect(() => {
    if (!collection) return;

    async function fetchNarrative() {
      try {
        const res = await generateCollectionNarrative({
          collectionName: collection?.name || "",
          baseDescription: collection?.description || "",
        });
        setNarrative(res.narrative);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingNarrative(false);
      }
    }
    fetchNarrative();
  }, [collection]);

  if (!collection) {
    return <div className="py-40 text-center">Collection not found.</div>;
  }

  return (
    <div className="space-y-20">
      {/* Collection Hero */}
      <section className="relative h-[70vh] w-full flex items-end overflow-hidden bg-muted">
        {/* Collection Hero Card Box Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <span className="text-[15vw] font-headline font-bold text-gray-900 uppercase tracking-tighter">
            {collection.name}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="container mx-auto px-6 pb-20 relative z-10 space-y-4">
          <nav className="flex items-center space-x-2 text-[10px] tracking-widest uppercase text-muted-foreground mb-4">
            <Link
              href={`/${countryCode}`}
              className="hover:text-primary transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Collections</span>
          </nav>
          <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase">
            Limited Release
          </span>
          <h1 className="text-6xl md:text-8xl font-headline font-bold">
            {collection.name}
          </h1>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex items-center space-x-4">
            <div className="h-px flex-1 bg-border" />
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-8 text-center">
            {loadingNarrative ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted w-full" />
                <div className="h-4 bg-muted w-5/6 mx-auto" />
                <div className="h-4 bg-muted w-4/6 mx-auto" />
              </div>
            ) : (
              <div className="prose prose-xl max-w-none font-light leading-relaxed text-gray-600 italic">
                {narrative}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-6 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 pb-8 border-b border-border">
          <h2 className="text-2xl font-headline font-bold uppercase tracking-widest">
            The Selection
          </h2>
          <div className="flex items-center space-x-8 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase cursor-pointer hover:text-primary transition-colors">
              <Filter className="w-3 h-3" />
              <span>Filter Pieces</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {collectionProducts.length} Items
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {collectionProducts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground italic">
            No items are currently available in this curated set.
          </div>
        )}
      </section>

      {/* CTA Footer */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-6 text-center space-y-8">
          <h3 className="text-3xl font-headline font-bold italic">
            Experience the Atelier
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto font-light">
            Each piece in the {collection.name} represents a marriage of
            centuries-old craft and contemporary vision.
          </p>
          <Button
            variant="outline"
            className="rounded-none border-foreground h-14 px-12 text-xs tracking-widest font-bold"
          >
            REQUEST A PRIVATE VIEWING
          </Button>
        </div>
      </section>
    </div>
  );
}
