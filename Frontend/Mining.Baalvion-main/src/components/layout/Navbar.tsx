"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, Menu, Search, User, Lightbulb, ChevronDown } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState({ code: "en", name: "English" });
  const [searchQuery, setSearchQuery] = useState("");

  const languages = [
    { code: "en", name: "English" },
    { code: "zh", name: "中文 (Chinese)" },
    { code: "ar", name: "العربية (Arabic)" },
    { code: "es", name: "Español (Spanish)" },
    { code: "fr", name: "Français (French)" },
    { code: "hi", name: "हिन्दी (Hindi)" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const NavLinks = () => (
    <>
      <Link href="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">Marketplace</Link>
      <Link href="/directory" className="text-sm font-medium hover:text-primary transition-colors">Suppliers</Link>
      <Link href="/guides" className="text-sm font-bold text-primary flex items-center gap-1.5 hover:text-primary/80 transition-colors">
        <Lightbulb className="h-4 w-4" aria-hidden="true" /> Knowledge Hub
      </Link>
      <Link href="/solutions" className="text-sm font-medium hover:text-primary transition-colors">Solutions</Link>
      <Link href="/logistics" className="text-sm font-medium hover:text-primary transition-colors">Logistics</Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm" role="navigation" aria-label="Main Navigation">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2" aria-label="Baalvion Mining Inc. Home">
            <div className="bg-primary rounded-lg p-1.5" aria-hidden="true">
              <Globe className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-lg md:text-xl font-bold tracking-tight text-primary leading-none">
                Baalvion <span className="text-secondary">Mining Inc.</span>
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter hidden sm:block">
                Global Mining & Commodity Supply Network
              </span>
            </div>
          </Link>
          <div className="hidden xl:flex gap-6 items-center">
            <NavLinks />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors w-full max-w-[200px] lg:max-w-xs group focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="h-4 w-4 shrink-0 group-focus-within:text-primary transition-colors" aria-hidden="true" />
            <input 
              type="search"
              placeholder="Search Network..."
              className="bg-transparent focus-visible:ring-offset-0 border-none text-xs w-full focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search across global marketplace"
            />
          </form>

          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-9 px-3 border border-transparent hover:border-slate-200" aria-label={`Select Language (Current: ${currentLang.name})`}>
                  <Globe className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider">{currentLang.code}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {languages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code} 
                    onClick={() => setCurrentLang(lang)}
                    className="text-xs font-medium cursor-pointer"
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href="/login" className="hidden sm:block">
            <Button variant="outline" size="sm" className="h-9 gap-2 border-primary text-primary hover:bg-primary/5" aria-label="Sign In">
              <User className="h-4 w-4" aria-hidden="true" />
              Sign In
            </Button>
          </Link>
          
          <Link href="/register" className="hidden md:block">
            <Button size="sm" className="h-9 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">
              Join Now
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open Mobile Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
              <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
              <SheetDescription className="sr-only">Access platform sections and trade tools on mobile</SheetDescription>
              <div className="p-6 border-b bg-primary text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-6 w-6 text-secondary" />
                  <span className="font-headline text-xl font-bold">Baalvion</span>
                </div>
                <p className="text-[10px] text-primary-foreground/60 uppercase font-bold tracking-widest leading-tight">Global Mining & Commodity Supply Network</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <NavLinks />
                </div>
                <div className="pt-6 border-t space-y-3">
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full justify-start h-12 border-primary text-primary">
                      <User className="mr-3 h-5 w-5" /> Sign In
                    </Button>
                  </Link>
                  <Link href="/register" className="block">
                    <Button className="w-full justify-start h-12 bg-secondary text-secondary-foreground">
                      <Globe className="mr-3 h-5 w-5" /> Register Business
                    </Button>
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
