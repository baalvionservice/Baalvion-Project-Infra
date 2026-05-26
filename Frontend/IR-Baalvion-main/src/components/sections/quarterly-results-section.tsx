"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, BarChart3, Mic } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function QuarterlyResultsSection() {
  const bgImage = PlaceHolderImages.find(p => p.id === "quarterly-results-bg");

  return (
    <section className="relative w-full h-[400px] text-white">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt="View from inside a tent looking out at mountains"
          data-ai-hint={bgImage.imageHint}
          fill
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-10">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-bold">Quarterly results</h2>
          <p className="text-xl font-semibold tracking-wider">Q4 2025</p>
        </div>
        <div className="grid grid-cols-3 gap-12 md:gap-24">
          <Link href="#" className="flex flex-col items-center gap-2 text-white hover:text-primary transition-colors">
            <FileText className="h-8 w-8" />
            <span className="font-semibold">Earnings Release</span>
          </Link>
          <Link href="#" className="flex flex-col items-center gap-2 text-white hover:text-primary transition-colors">
            <BarChart3 className="h-8 w-8" />
            <span className="font-semibold">Earnings Supplement</span>
          </Link>
          <Link href="#" className="flex flex-col items-center gap-2 text-white hover:text-primary transition-colors">
            <Mic className="h-8 w-8" />
            <span className="font-semibold">Webcast</span>
          </Link>
        </div>
        <Button className="bg-white text-black hover:bg-gray-200 rounded-sm">
          All quarters <span className="text-primary ml-2 font-bold">{'>'}</span>
        </Button>
      </div>
    </section>
  );
}
