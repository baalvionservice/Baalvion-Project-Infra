import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { newsArticles } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export default function NewsSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Media & News</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Stay informed with the latest announcements, strategic partnerships, and press from Baalvion.
          </p>
        </div>
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            {newsArticles.map((article, index) => {
              const articleImage = PlaceHolderImages.find((p) => p.id === article.imageId);
              return (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className="flex flex-col h-full">
                    <CardHeader>
                      {articleImage && (
                        <Image
                          src={articleImage.imageUrl}
                          alt={article.title}
                          data-ai-hint={articleImage.imageHint}
                          width={600}
                          height={400}
                          className="rounded-t-lg object-cover aspect-[3/2]"
                        />
                      )}
                      <CardTitle className="pt-4">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant="link" className="p-0 h-auto">
                        <Link href="#">
                            Read More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CarouselItem>
            );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
}
