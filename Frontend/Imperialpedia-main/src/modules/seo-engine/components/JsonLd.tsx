'use client';

import React from 'react';

interface JsonLdProps {
  data: any;
}

/**
 * Injects JSON-LD structured data into the page head.
 * Critical for SEO performance on programmatic pages.
 */
export const JsonLd = ({ data }: JsonLdProps) => {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};
