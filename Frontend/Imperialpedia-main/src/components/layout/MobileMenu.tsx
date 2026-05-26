'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { routes } from '@/config/routes';
import { Text } from '@/design-system/typography/text';
import { cn } from '@/lib/utils';
import { platformConfig } from '@/config/platform';

const navLinks = [
  { label: 'Home', href: routes.public.home },
  { label: 'Glossary', href: routes.public.glossary },
  { label: 'AI Content Outline', href: routes.public.outline },
  { label: 'Financial Calculators', href: routes.public.calculators },
  { label: 'Expert Creators', href: routes.public.creators },
];

/**
 * Responsive mobile menu component using a Sheet/Drawer pattern.
 */
const MobileMenu = () => {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b text-left">
          <SheetTitle>
            <Link href="/" className="text-2xl font-headline font-bold text-primary tracking-tight" onClick={() => setOpen(false)}>
              Imperial<span className="text-foreground">pedia</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto py-4">
          <div className="px-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search knowledge..."
                className="w-full bg-muted/50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <nav className="space-y-1 px-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-primary/10 text-primary font-bold' 
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  <Text variant="body">{link.label}</Text>
                  <ChevronRight className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/30")} />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t bg-muted/20">
          <Button className="w-full font-bold h-12" onClick={() => setOpen(false)}>
            Get Started
          </Button>
          <Text variant="caption" align="center" className="mt-4 text-muted-foreground">
            © {new Date().getFullYear()} {platformConfig.name}
          </Text>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
