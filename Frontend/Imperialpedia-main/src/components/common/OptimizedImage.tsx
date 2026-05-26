"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getOptimizedImageSizes, isMobileDevice } from "@/lib/performance";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
  sizes,
  quality = 75,
  ...props
}: OptimizedImageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const optimizedSizes = sizes || getOptimizedImageSizes(isMobile);
  const optimizedQuality = isMobile ? Math.min(quality, 60) : quality;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        sizes={optimizedSizes}
        quality={optimizedQuality}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
