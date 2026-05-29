'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { GFBusiness } from '@/hooks/use-global-financials';
import { cn } from '@/lib/utils';

interface BusinessSelectorProps {
  businesses: GFBusiness[];
  selectedBusiness: GFBusiness;
  onSelectBusiness: (business: GFBusiness) => void;
}

export default function BusinessSelector({ businesses, selectedBusiness, onSelectBusiness }: BusinessSelectorProps) {
  return (
    <Carousel opts={{
      align: "start",
      dragFree: true,
    }}>
      <CarouselContent className="pr-12">
        {businesses.map((biz) => {
          const image = PlaceHolderImages.find(i => i.id === biz.imageId);
          return (
            <CarouselItem key={biz.id} className="basis-1/2 md:basis-1/3 pl-2">
              <Card 
                onClick={() => onSelectBusiness(biz)}
                className={cn("cursor-pointer", selectedBusiness.id === biz.id && "border-primary ring-2 ring-primary")}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                   <Avatar className="h-12 w-12">
                        {image && <AvatarImage src={image.imageUrl} />}
                        <AvatarFallback>{biz.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  <div className="text-center">
                    <p className="font-semibold text-sm truncate">{biz.name}</p>
                    <p className="text-xs text-muted-foreground">{biz.country}</p>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}
