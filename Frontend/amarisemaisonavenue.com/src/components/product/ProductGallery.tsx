"use client";

import React, { useState } from "react";
import { VerticalGallery } from "./VerticalGallery";
import { ImageZoom } from "./ImageZoom";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Use the selected image or fallback to the first image
  const currentImage = images[selectedImageIndex] || images[0];
  return (
    <div className={className}>
      <div className=" flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-10 w-full">
        {/* Vertical Gallery Thumbnails - Hidden on mobile if only one image */}
        {images.length > 1 && (
          <VerticalGallery
            images={images}
            productName={productName}
            selectedIndex={selectedImageIndex}
            onImageSelect={handleImageSelect}
          />
        )}

        {/* Main Artifact Viewport */}
        <div className="hidden md:flex flex-1 w-full">
          <ImageZoom
            src={currentImage}
            alt={productName}
            className="w-full aspect-[4/5] luxury-reveal"
            zoomScale={2.5}
          />
        </div>
      </div>
    </div>
  );
}
