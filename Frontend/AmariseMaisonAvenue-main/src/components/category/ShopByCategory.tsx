"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { SidebarNavItem, SubItem } from "@/lib/mock-category-data";

interface ShopByCategoryProps {
  title: string;
  items: SidebarNavItem[] | SubItem[];
  countryCode: string;
  variant?: "style" | "size";
}

export function ShopByCategory({
  title,
  items,
  countryCode,
  variant = "style",
}: ShopByCategoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-card]");
    const step = firstCard
      ? firstCard.offsetWidth + 24
      : variant === "style"
      ? 280
      : 216;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  const cardWidth = "w-36";
  const imageSize = 300;
  const textSize = "text-sm";

  return (
    <div className="mb-2">
      <h2 className="text-sm font-medium uppercase text-black tracking-widest pb-1">
        {title}:
      </h2>

      {/* Row: [arrow] [cards] [arrow] */}
      <div className="relative flex items-center gap-2">
        {/* ← Prev */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={cn(
            "hidden  absolute left-5 z-10 w-8 h-8 rounded-full border md:flex items-center justify-center bg-white transition-all shadow-sm",
            canScrollLeft
              ? "border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-900"
              : "hidden border-gray-100 text-gray-200 cursor-not-allowed opacity-50"
          )}
          aria-label="Previous"
        >
          <ChevronLeft className="w-[14px] h-[14px]" />
        </button>

        {/* Scrollable cards track */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto flex-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`div::-webkit-scrollbar{display:none}`}</style>
          {items.map((item) => (
            <div key={item.id} data-card>
              <Link
                href={`/${countryCode}/category/${item.id}`}
                className="flex-shrink-0 group"
              >
                <div className={cn(cardWidth, "bg-white overflow-hidden")}>
                  <div className="aspect-[4/5] relative  bg-gray-50">
                    <Image
                      src={`https://picsum.photos/seed/hermes-${item.id}/${imageSize}/${imageSize}`}
                      alt={item.label}
                      width={100}
                      height={100}
                      className="object-cover absolute left-1/2 bottom-5 transform -translate-x-1/2"
                    />
                  </div>
                  <h3
                    className={cn(
                      " text-[#1a1a1a]  tracking-wider text-center",
                      textSize
                    )}
                  >
                    {item.label}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* → Next */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={cn(
            "hidden absolute right-5 z-10 w-8 h-8 rounded-full border md:flex items-center justify-center bg-white transition-all shadow-sm",
            canScrollRight
              ? "border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-900"
              : "hidden border-gray-100 text-gray-200 cursor-not-allowed opacity-50"
          )}
          aria-label="Next"
        >
          <ChevronRight className="w-[14px] h-[14px]" />
        </button>
      </div>
    </div>
  );
}
