'use client';

import React from 'react';

interface JsonLdProps {
  data: any;
}

/**
 * `JSON.stringify` escapes neither `<` nor `/`, so a stored value containing
 * `</script>` closes this element early and everything after it parses as
 * markup. The escaped form is valid JSON and decodes to the same string, so
 * consumers see identical structured data.
 */
const jsonLdHtml = (data: unknown): string =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

/**
 * Injects JSON-LD structured data into the page head.
 * Critical for SEO performance on programmatic pages.
 */
export const JsonLd = ({ data }: JsonLdProps) => {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }}
    />
  );
};
