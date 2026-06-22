"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, Menu, Search, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sharedSignInUrl } from "@/lib/shared-auth";

type NavChild = { label: string; href: string };
type NavItem = { label: string; href?: string; children?: NavChild[] };

const NAV: NavItem[] = [
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About Us", href: "/about" },
      { label: "Leadership & Governance", href: "/leadership" },
      { label: "Certifications", href: "/certifications" },
      { label: "Licenses & Compliance", href: "/licenses" },
      { label: "Sustainability (ESG)", href: "/esg" },
      { label: "Health, Safety & Environment", href: "/hse" },
      { label: "Community & CSR", href: "/community" },
      { label: "News & Media", href: "/news" },
    ],
  },
  {
    label: "Operations",
    href: "/operations",
    children: [
      { label: "Mining Operations", href: "/operations" },
      { label: "Mine Sites", href: "/mine-sites" },
      { label: "Equipment & Fleet", href: "/equipment" },
      { label: "Quality Control", href: "/quality" },
      { label: "Supply Chain", href: "/supply-chain" },
      { label: "Logistics", href: "/logistics" },
      { label: "Projects", href: "/projects" },
    ],
  },
  {
    label: "Quarry",
    href: "/quarry",
    children: [
      { label: "Quarry Overview", href: "/quarry" },
      { label: "Locations", href: "/quarry/locations" },
      { label: "Capabilities", href: "/quarry/capabilities" },
      { label: "Production", href: "/quarry/production" },
      { label: "Equipment & Machinery", href: "/quarry/equipment" },
      { label: "Safety Programs", href: "/quarry/safety" },
      { label: "Environmental", href: "/quarry/environmental" },
      { label: "Rehabilitation", href: "/quarry/rehabilitation" },
    ],
  },
  { label: "Products", href: "/products" },
  {
    label: "Investors",
    href: "/investors",
    children: [
      { label: "Investor Relations", href: "/investors" },
      { label: "Corporate Documents", href: "/corporate-documents" },
      { label: "Leadership & Governance", href: "/leadership" },
      { label: "Licenses & Compliance", href: "/licenses" },
      { label: "ESG Reporting", href: "/esg" },
    ],
  },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm" role="navigation" aria-label="Main Navigation">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2" aria-label="Baalvion Mining Inc. Home">
            <div className="bg-primary rounded-lg p-1.5" aria-hidden="true">
              <Globe className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-lg md:text-xl font-bold tracking-tight text-primary leading-none">
                Baalvion <span className="text-secondary">Mining Inc.</span>
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter hidden sm:block">
                Mining · Quarry · Minerals · Logistics
              </span>
            </div>
          </Link>

          {/* Desktop nav with mega-menu dropdowns */}
          <div className="hidden xl:flex items-center gap-1">
            {NAV.map((item) =>
              item.children ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-60">
                    {item.children.map((c) => (
                      <DropdownMenuItem key={c.href} asChild className="cursor-pointer text-sm font-medium">
                        <Link href={c.href}>{c.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link key={item.label} href={item.href!} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:text-primary hover:bg-primary/5 transition-colors">
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors w-full max-w-[180px] group focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="h-4 w-4 shrink-0 group-focus-within:text-primary transition-colors" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search..."
              className="bg-transparent border-none text-xs w-full focus:outline-none placeholder:text-muted-foreground/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search the site"
            />
          </form>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.location.assign(sharedSignInUrl())}
            className="hidden sm:flex h-9 gap-2 border-primary text-primary hover:bg-primary/5"
            aria-label="Sign In"
          >
            <User className="h-4 w-4" aria-hidden="true" /> Sign In
          </Button>
          <Link href="/contact" className="hidden md:block">
            <Button size="sm" className="h-9 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">
              Get in touch
            </Button>
          </Link>

          {/* Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open Mobile Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] p-0 flex flex-col">
              <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
              <SheetDescription className="sr-only">Browse the Baalvion corporate site</SheetDescription>
              <div className="p-6 border-b bg-primary text-white">
                <div className="flex items-center gap-2">
                  <Globe className="h-6 w-6 text-secondary" />
                  <span className="font-headline text-xl font-bold">Baalvion Mining Inc.</span>
                </div>
                <p className="text-[10px] text-primary-foreground/60 uppercase font-bold tracking-widest mt-1">Mining · Quarry · Minerals · Logistics</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <Accordion type="multiple" className="w-full">
                  {NAV.map((item) =>
                    item.children ? (
                      <AccordionItem key={item.label} value={item.label} className="border-b">
                        <AccordionTrigger className="text-sm font-bold text-slate-800 hover:text-primary hover:no-underline">{item.label}</AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-1 pb-2">
                            {item.children.map((c) => (
                              <Link key={c.href} href={c.href} className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors">{c.label}</Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : (
                      <Link key={item.label} href={item.href!} className="flex items-center border-b py-4 text-sm font-bold text-slate-800 hover:text-primary transition-colors">{item.label}</Link>
                    ),
                  )}
                </Accordion>
                <div className="pt-6 space-y-3">
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full justify-start h-12 border-primary text-primary"><User className="mr-3 h-5 w-5" /> Sign In</Button>
                  </Link>
                  <Link href="/contact" className="block">
                    <Button className="w-full justify-start h-12 bg-secondary text-secondary-foreground"><Globe className="mr-3 h-5 w-5" /> Get in touch</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
