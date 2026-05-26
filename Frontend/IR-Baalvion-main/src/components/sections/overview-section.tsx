import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";

export default function OverviewSection({ id }: { id: string }) {
  const roadmapImage = PlaceHolderImages.find((p) => p.id === "roadmap-infographic");

  return (
    <section id={id} className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="inline-block rounded-lg bg-card px-3 py-1 text-sm font-medium text-primary">
              Our Vision
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Engineering the Backbone of Global Trade
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
             At Baalvion, our mission is to build and operate the foundational B2B trade ecosystem for the next century. We create value by acquiring and integrating key technologies in logistics, finance, and compliance, creating a seamless, efficient, and transparent operating system for global commerce.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" disabled>Download Whitepaper (Coming Soon)</Button>
            </div>
          </div>
          <div className="flex justify-center">
            {roadmapImage && (
              <Image
                src={roadmapImage.imageUrl}
                alt="Baalvion 5-Year Roadmap"
                data-ai-hint={roadmapImage.imageHint}
                width={600}
                height={750}
                className="rounded-xl shadow-2xl"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
