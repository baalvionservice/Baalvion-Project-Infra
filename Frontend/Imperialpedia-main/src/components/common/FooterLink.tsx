'use client';

import React from 'react';
import Link from 'next/link';

interface FooterLinkProps {
  href: string;
  text: string;
}

/**
 * Individual Footer Navigation Node.
 * Optimized for discovery traversal and accessibility.
 */
export default function FooterLink({ href, text }: FooterLinkProps) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm outline-none focus-visible:text-primary"
    >
      {text}
    </Link>
  );
}
