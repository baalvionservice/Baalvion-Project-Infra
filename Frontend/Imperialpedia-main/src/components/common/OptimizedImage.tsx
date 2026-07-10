"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { getOptimizedImageSizes } from "@/lib/performance";

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
  // Priority images are LCP candidates — render them at full opacity
  // immediately instead of fading in, so the fade transition never delays
  // the measured Largest Contentful Paint.
  const [isLoaded, setIsLoaded] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // The browser can decode and paint an <img> (especially instant inline
  // data: URIs) before React finishes hydrating and attaches `onLoad` below.
  // When that happens the native load event fires into the void and the
  // image is stuck at opacity-0 forever. Catch that case on mount/src-change.
  useEffect(() => {
    if (imgRef.current?.complete) setIsLoaded(true);
  }, [src]);

  // The `sizes` string already encodes device-width breakpoints, so the
  // browser picks the right srcset entry itself with no JS device detection
  // needed. Deriving `quality` from client-side device sniffing instead made
  // the optimized-image URL change post-hydration, forcing a second network
  // fetch of the same image right after the first one landed.
  const optimizedSizes = sizes || getOptimizedImageSizes();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`${
          priority ? "" : "transition-opacity duration-300"
        } ${isLoaded ? "opacity-100" : "opacity-0"}`}
        sizes={optimizedSizes}
        quality={quality}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
