
'use client';

import React from 'react';
import placeholderData from '@/app/lib/placeholder-images.json';
import { BrandImage } from './BrandImage';

interface PlaceholderImageProps {
  id?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}

/**
 * PlaceholderImage: resolves a named asset from the Maison registry and renders it via
 * BrandImage — so real uploaded photos show, and dev placeholders fall back to the
 * elegant branded panel instead of a random stock image.
 */
export function PlaceholderImage({
  id = 'product-luxury-default',
  alt = 'Amarisé Maison Artifact',
  className,
  priority = false,
}: PlaceholderImageProps) {
  const asset =
    placeholderData.placeholderImages.find((img) => img.id === id) ||
    placeholderData.placeholderImages.find((img) => img.id === 'product-luxury-default');

  return (
    <BrandImage src={asset?.imageUrl} alt={alt} className={className} priority={priority} />
  );
}
