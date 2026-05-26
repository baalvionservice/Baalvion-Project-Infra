'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SearchModal } from '@/components/search/SearchModal';
import { Button } from '@/components/ui/button';
import Navigation from './Navigation';
import MobileMenu from './MobileMenu';
import { Container } from '@/design-system/layout/container';
import { Search } from 'lucide-react';

/**
 * Standard Header component with smart search integration.
 */
const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <Container className="h-16 flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="text-2xl font-headline font-bold text-primary tracking-tight">
              Imperial<span className="text-foreground">pedia</span>
            </Link>
            
            {/* Center: Desktop Navigation */}
            <div className="hidden lg:block">
              <Navigation />
            </div>
          </div>

          {/* Center/Right: Search Bar Trigger */}
          <div className="hidden md:flex flex-1 justify-center max-w-sm">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center gap-3 px-4 h-10 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-transparent hover:border-primary/20 text-sm"
            >
              <Search size={16} />
              <span>Search knowledge...</span>
              <span className="ml-auto text-[10px] font-bold opacity-50 bg-background px-1.5 py-0.5 rounded border">⌘K</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" className="font-bold">
                Login
              </Button>
              <Button className="font-bold px-6 shadow-lg shadow-primary/20">
                Join Waitlist
              </Button>
            </div>

            <MobileMenu />
          </div>
        </Container>
      </header>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};

export default Header;
