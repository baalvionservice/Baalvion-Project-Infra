
'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import placeholderData from '@/app/lib/placeholder-images.json';

interface PlaceholderImageProps {
  id?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}

/**
 * PlaceholderImage: The Institutional Visual Hub.
 * Resolves high-fidelity assets from the Maison registry.
 */
export function PlaceholderImage({ 
  id = 'product-luxury-default', 
  alt = 'Amarisé Maison Artifact',
  className,
  priority = false
}: PlaceholderImageProps) {
  const asset = placeholderData.placeholderImages.find(img => img.id === id) || 
                placeholderData.placeholderImages.find(img => img.id === 'product-luxury-default');

  if (!asset) return null;

  return (
    <div className={cn("relative overflow-hidden bg-[#fcfcfc]", className)}>
      <Image
        src={asset.imageUrl}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        data-ai-hint={asset.imageHint}
      />
    </div>
  );
}
