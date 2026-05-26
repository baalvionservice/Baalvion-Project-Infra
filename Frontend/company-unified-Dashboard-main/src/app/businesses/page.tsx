"use client";

import { useState } from "react";
import BusinessSelector from "./components/business-selector";
import BusinessDetails from "./components/business-details";
import businessesData from "@/lib/data/businesses";
import type { Business } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

export default function BusinessesPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business>(
    businessesData[0] as Business
  );
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
        <div className="w-screen ">

        <BusinessSelector
          businesses={businessesData as Business[]}
          selectedBusiness={selectedBusiness}
          onSelectBusiness={setSelectedBusiness}
          />
          </div>
        <BusinessDetails business={selectedBusiness} />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <h2 className="text-xl font-bold tracking-tight mb-4">
          All Businesses
        </h2>
        <div className="space-y-1">
          {(businessesData as Business[]).map((biz) => {
            const image = PlaceHolderImages.find((i) => i.id === biz.imageId);
            return (
              <Card
                key={biz.id}
                onClick={() => setSelectedBusiness(biz)}
                className={cn(
                  "p-3 cursor-pointer",
                  selectedBusiness.id === biz.id
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {image && <AvatarImage src={image.imageUrl} />}
                    <AvatarFallback>{biz.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{biz.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {biz.country}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <div className="md:col-span-2">
        <BusinessDetails business={selectedBusiness} />
      </div>
    </div>
  );
}
