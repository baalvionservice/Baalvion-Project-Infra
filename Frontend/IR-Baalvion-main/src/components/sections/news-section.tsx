import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { newsArticles } from "@/lib/data";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, Newspaper } from "lucide-react";

// On-brand gradient banner per category — no external image dependency, renders
// crisply on mobile, iPad and desktop.
const CATEGORY_GRADIENT: Record<string, string> = {
  Vision: "from-primary/80 to-primary/30",
  Compliance: "from-neutral-800 to-neutral-600",
  Platform: "from-primary/60 to-neutral-800",
  Governance: "from-neutral-900 to-primary/40",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function NewsSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Media &amp; News</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            The latest perspectives, strategy and announcements from Baalvion Industries.
          </p>
        </div>
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent>
            {newsArticles.map((article, index) => {
              const grad = CATEGORY_GRADIENT[(article as { category?: string }).category ?? ""] ?? "from-primary/60 to-neutral-800";
              return (
              <CarouselItem key={index} className="basis-full sm:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className="flex flex-col h-full overflow-hidden transition-shadow hover:shadow-xl">
                    <div className={`relative flex aspect-[3/2] items-end bg-gradient-to-br ${grad} p-4`}>
                      <Newspaper className="absolute right-4 top-4 h-6 w-6 text-white/40" />
                      <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                        {(article as { category?: string }).category ?? "News"}
                      </span>
                    </div>
                    <CardHeader>
                      <p className="text-xs font-medium text-muted-foreground">{formatDate(article.date)}</p>
                      <CardTitle className="pt-1 text-lg leading-snug">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant="link" className="p-0 h-auto">
                        <Link href="/news-and-events/news">
                            Read more <ArrowRight className="ml-2 h-4 w-4" />
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
