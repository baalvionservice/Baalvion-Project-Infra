'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'Research AI', href: '/research-ai' },
  { label: 'Datasets', href: '/datasets' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-6">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              isActive ? 'text-primary font-bold' : 'text-muted-foreground'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;
