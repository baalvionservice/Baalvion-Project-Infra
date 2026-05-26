'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoCardProps {
  src: string;
  alt: string;
  index: number;
}

/**
 * Individual Social Proof Logo Card.
 * Features sequenced entrance animations and optimized lazy loading.
 */
export default function LogoCard({ src, alt, index }: LogoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
      className="flex items-center justify-center group px-4 py-6"
    >
      <div className="relative w-full h-12 flex items-center justify-center transition-all duration-500">
        {/* Grayscale Version (Default) with Lazy Loading */}
        <div className="grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110">
          <Image
            src={src}
            alt={alt}
            width={160}
            height={48}
            className="object-contain max-h-8 w-auto"
            loading="lazy"
            data-ai-hint="company logo"
          />
        </div>
      </div>
    </motion.div>
  );
}
