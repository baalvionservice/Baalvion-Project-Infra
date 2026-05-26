"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VerticalGalleryProps {
  images: string[];
  productName: string;
  onImageSelect?: (index: number) => void;
  selectedIndex?: number;
  visibleCount?: number;
  className?: string;
}

export function VerticalGallery({
  images,
  productName,
  onImageSelect,
  selectedIndex = 0,
  visibleCount = 5,
  className,
}: VerticalGalleryProps) {
  const [scrollIndex, setScrollIndex] = useState(0);
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Create gallery images (repeat if needed for demo, or use actual images)
  const galleryImages =
    images.length > 1
      ? images
      : Array.from({ length: 8 }, () => images[0] || "");

  const maxScrollIndex = Math.max(0, galleryImages.length - visibleCount);

  const scrollUp = useCallback(() => {
    setScrollIndex((prev) => {
      if (prev === 0) {
        return maxScrollIndex; // Jump to bottom when at top
      }
      return prev - 1;
    });
  }, [maxScrollIndex]);

  const scrollDown = useCallback(() => {
    setScrollIndex((prev) => {
      if (prev >= maxScrollIndex) {
        return 0; // Jump to top when at bottom
      }
      return prev + 1;
    });
  }, [maxScrollIndex]);

  const scrollToMobileImage = useCallback(
    (index: number) => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const imageWidth = container.scrollWidth / galleryImages.length;
        container.scrollTo({
          left: imageWidth * index,
          behavior: "smooth",
        });
        setCurrentMobileIndex(index);
      }
    },
    [galleryImages.length]
  );

  const handleMobileScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const imageWidth = container.scrollWidth / galleryImages.length;
      const newIndex = Math.round(container.scrollLeft / imageWidth);
      setCurrentMobileIndex(newIndex);
    }
  }, [galleryImages.length]);

  const handleImageClick = useCallback(
    (index: number) => {
      onImageSelect?.(index);
    },
    [onImageSelect]
  );

  const visibleImages = galleryImages.slice(
    scrollIndex,
    scrollIndex + visibleCount
  );

  return (
    <>
      {/* Desktop Version - Vertical */}
      <div className={cn("hidden md:flex flex-col w-24 shrink-0", className)}>
        {/* Up Arrow */}
        <button
          onClick={scrollUp}
          className="flex items-center justify-center h-8 mb-2 transition-all duration-200 hover:bg-gray-50 rounded disabled:opacity-50"
          aria-label="Scroll up"
          disabled={galleryImages.length <= visibleCount}
        >
          <ChevronUp className="w-6 h-6 stroke-1" />
        </button>

        {/* Thumbnail Container */}
        <div className="flex flex-col space-y-3">
          {visibleImages.map((image, index) => {
            const actualIndex = scrollIndex + index;
            const isSelected = actualIndex === selectedIndex;
            return (
              <div
                key={actualIndex}
                onClick={() => handleImageClick(actualIndex)}
                className={cn(
                  "aspect-square cursor-pointer transition-all duration-300 group relative rounded-sm overflow-hidden",
                  isSelected && "ring-2 ring-black"
                )}
              >
                <div className="relative w-full h-full bg-gray-50">
                  <Image
                    src={image}
                    alt={`${productName} view ${actualIndex + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Down Arrow */}
        <button
          onClick={scrollDown}
          className="flex items-center justify-center h-8 mt-2 transition-all duration-200 rounded"
          aria-label="Scroll down"
          disabled={galleryImages.length <= visibleCount}
        >
          <ChevronDown className="w-6 h-6 stroke-1" />
        </button>
      </div>

      {/* Mobile Version - Horizontal with dots */}
      <div className={cn("md:hidden w-full", className)}>
        {/* Horizontal scroll container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            onScroll={handleMobileScroll}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {galleryImages.map((image, index) => (
              <div
                key={index}
                onClick={() => handleImageClick(index)}
                className="flex-shrink-0 w-[100%] h-72 cursor-pointer transition-all duration-300 relative rounded-sm overflow-hidden snap-start"
              >
                <div className="relative w-full h-full bg-gray-50">
                  <Image
                    src={image}
                    alt={`${productName} view ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instagram-style dots */}
        <div className="flex justify-center space-x-2 mt-2">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToMobileImage(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentMobileIndex
                  ? "bg-black"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
