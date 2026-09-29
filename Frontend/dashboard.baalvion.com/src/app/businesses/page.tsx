"use client";

import { useState, useEffect } from "react";
import BusinessSelector from "./components/business-selector";
import BusinessDetails from "./components/business-details";
import { useGlobalFinancials, type GFBusiness } from "@/hooks/use-global-financials";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

export default function BusinessesPage() {
  const { businesses } = useGlobalFinancials();
  const [selectedId, setSelectedId] = useState<string>("");
  const isMobile = useIsMobile();

  // Default selection to the first business once loaded.
  useEffect(() => {
    if (businesses.length && !selectedId) setSelectedId(businesses[0].id);
  }, [businesses, selectedId]);

  const selectedBusiness = businesses.find((b) => b.id === selectedId) ?? businesses[0];

  if (isMobile) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
        <div className="w-screen ">
          <BusinessSelector
            businesses={businesses}
            selectedBusiness={selectedBusiness}
            onSelectBusiness={(b: GFBusiness) => setSelectedId(b.id)}
          />
        </div>
        {selectedBusiness && <BusinessDetails business={selectedBusiness} />}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <h2 className="text-xl font-bold tracking-tight mb-4">All Businesses</h2>
        <div className="space-y-1">
          {businesses.map((biz) => {
            const image = PlaceHolderImages.find((i) => i.id === biz.imageId);
            return (
              <Card
                key={biz.id}
                onClick={() => setSelectedId(biz.id)}
                className={cn(
                  "p-3 cursor-pointer",
                  selectedBusiness?.id === biz.id ? "bg-muted" : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {image && <AvatarImage src={image.imageUrl} />}
                    <AvatarFallback>{biz.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{biz.name}</p>
                    <p className="text-sm text-muted-foreground">{biz.country}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <div className="md:col-span-2">
        {selectedBusiness && <BusinessDetails business={selectedBusiness} />}
      </div>
    </div>
  );
}
