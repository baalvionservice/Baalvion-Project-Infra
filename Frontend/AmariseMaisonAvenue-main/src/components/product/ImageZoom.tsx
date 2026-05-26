"use client";

import React, { useState, useRef, MouseEvent } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
}

export function ImageZoom({
  src,
  alt,
  className,
  zoomScale = 2.5,
}: ImageZoomProps) {
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile()

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-white border border-gray-50 shadow-sm",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-cover transition-transform duration-300 ease-out",
            isZooming && "cursor-zoom-in"
          )}
          style={{
            transform: isZooming ? `scale(${zoomScale})` : "scale(1)",
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
          }}
          priority
          sizes="(max-width: 768px) 100vw, 55vw"
        />
      </div>

      {/* Zoom indicator */}
      {isZooming && (
        <div
          className="absolute w-4 h-4 border-2 border-white shadow-lg rounded-full pointer-events-none z-10"
          style={{
            left: `${zoomPosition.x}%`,
            top: `${zoomPosition.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
}
