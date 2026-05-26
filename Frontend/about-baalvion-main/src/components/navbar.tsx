"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  ChevronRight,
  Mail,
  Search,
  Megaphone,
  BarChart3,
  BrainCircuit,
  Scale,
  Leaf,
  Users,
  Globe2,
  FileText,
  Target,
  Sparkles,
  UserCheck,
  Activity,
  Cpu,
  Layers,
  Briefcase,
  ClipboardList,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const newsItems = [
  {
    name: "Company Updates",
    href: "/news/updates",
    desc: "Press releases & official announcements",
    icon: Megaphone,
  },
  {
    name: "Global Trade Insights",
    href: "/news/insights",
    desc: "Research & industry trends",
    icon: BarChart3,
  },
  {
    name: "Technology & AI",
    href: "/news/tech",
    desc: "Platform updates & AI scoring",
    icon: BrainCircuit,
  },
  {
    name: "Finance & Compliance",
    href: "/news/finance",
    desc: "Trade finance & compliance news",
    icon: Scale,
  },
  {
    name: "Sustainability & ESG",
    href: "/news/sustainability",
    desc: "Green initiatives & ESG reports",
    icon: Leaf,
  },
  {
    name: "Community & Partnerships",
    href: "/news/community",
    desc: "Collaborations & network updates",
    icon: Users,
  },
  {
    name: "International Markets",
    href: "/news/markets",
    desc: "Global expansion & trade routes",
    icon: Globe2,
  },
  {
    name: "Featured Reports",
    href: "/news/reports",
    desc: "Major project highlights",
    icon: FileText,
  },
];

const aboutItems = [
  {
    name: "What We Do",
    href: "/company",
    desc: "Baalvion Operating System (BOS) & platform layers",
    icon: Target,
  },
  {
    name: "Working at Baalvion",
    href: "/careers",
    desc: "Careers, team stories, & culture",
    icon: Sparkles,
  },
  {
    name: "Leadership & Founders",
    href: "/leadership",
    desc: "Vision, timeline, & leadership",
    icon: UserCheck,
  },
  {
    name: "Investor Letters",
    href: "/investors",
    desc: "Shareholder updates & reports",
    icon: Mail,
  },
  {
    name: "Platform Reports",
    href: "/reports",
    desc: "Execution metrics & system updates",
    icon: Activity,
  },
];

const mainLinks = [
  { name: "Platform", href: "/platform", icon: Cpu },
  { name: "Ecosystem", href: "/ecosystem", icon: Layers },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Updates Log", href: "/updates", icon: ClipboardList },
  { name: "Trust", href: "/trust", icon: ShieldCheck },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setShowSearch(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/news/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setShowSearch(false);
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-[100] transition-all duration-300",
        scrolled
          ? "bg-white/98 backdrop-blur-md border-b border-gray-100 h-16 shadow-sm"
          : "bg-white h-20 border-b border-transparent"
      )}
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl h-full mx-auto px-4 md:px-0 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group shrink-0 relative z-[110]"
          aria-label="Baalvion Home"
        >
          <div
            className="w-9 h-9 bg-primary flex items-center justify-center rounded-sm transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            <Globe className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 leading-none">
            BAALVION
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="px-3 xl:px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 rounded-sm transition-all flex items-center gap-1 outline-none group"
              aria-haspopup="true"
            >
              News & Insights
              <ChevronDown
                className="w-3.5 h-3.5 opacity-50 group-data-[state=open]:rotate-180 transition-transform"
                aria-hidden="true"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-80 p-2 bg-white border-gray-100 shadow-xl rounded-md animate-in fade-in zoom-in-95"
            >
              <div className="p-3 mb-2 bg-gray-50/50 rounded-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Global Intelligence
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {newsItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className="p-0 focus:bg-transparent"
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-sm hover:bg-gray-50 group transition-colors"
                    >
                      <item.icon
                        className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="px-3 xl:px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 rounded-sm transition-all flex items-center gap-1 outline-none group"
              aria-haspopup="true"
            >
              About & Company
              <ChevronDown
                className="w-3.5 h-3.5 opacity-50 group-data-[state=open]:rotate-180 transition-transform"
                aria-hidden="true"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-80 p-2 bg-white border-gray-100 shadow-xl rounded-md animate-in fade-in zoom-in-95"
            >
              <div className="p-3 mb-2 bg-gray-50/50 rounded-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Corporate Baalvion Operating System (BOS)
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {aboutItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className="p-0 focus:bg-transparent"
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-sm hover:bg-gray-50 group transition-colors"
                    >
                      <item.icon
                        className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-2 xl:px-3 py-2 text-sm font-semibold transition-all rounded-sm whitespace-nowrap",
                pathname === link.href
                  ? "text-primary bg-primary/5"
                  : "text-gray-700 hover:text-primary hover:bg-gray-50"
              )}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.name}
            </Link>
          ))}

          <div className="flex items-center gap-3 xl:gap-4 ml-2 xl:ml-4">
            <Link
              href="#"
              className="hidden xl:flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-primary group transition-colors whitespace-nowrap"
              aria-label="Subscribe to weekly insights"
            >
              Subscribe{" "}
              <Mail
                className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"
                aria-hidden="true"
              />
            </Link>
            <form
              onSubmit={handleSearch}
              className="relative group"
              role="search"
            >
              <label htmlFor="desktop-search" className="sr-only">
                Search Baalvion News
              </label>
              <input
                id="desktop-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search News"
                className="h-9 w-36 xl:w-48 pl-4 pr-9 rounded-full border border-gray-300 bg-gray-50/50 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all placeholder:text-gray-500"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-900 hover:text-primary transition-colors"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          <Button
            asChild
            className="h-10 px-4 btn-primary rounded-sm font-bold text-sm whitespace-nowrap"
            aria-label="Initiate BOS link for strategic partnership"
          >
            <Link href="/contact">Initiate BOS Link</Link>
          </Button>
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-2 relative z-[110]">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 text-gray-900 hover:bg-gray-50 rounded-full transition-colors"
            aria-label={showSearch ? "Close search" : "Open search"}
            aria-expanded={showSearch}
          >
            <Search className="w-6 h-6" aria-hidden="true" />
          </button>
          <button
            className="p-2.5 text-gray-900 hover:bg-gray-50 rounded-full transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={
              isOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="w-7 h-7" aria-hidden="true" />
            ) : (
              <Menu className="w-7 h-7" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-x-0 top-0 bg-white z-[105] p-4 border-b border-gray-100 transition-all duration-300 transform",
          showSearch
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        )}
        style={{ marginTop: scrolled ? "64px" : "80px" }}
        role="search"
        aria-hidden={!showSearch}
      >
        <form onSubmit={handleSearch} className="relative">
          <label htmlFor="mobile-search" className="sr-only">
            Search Intelligence Registry
          </label>
          <input
            id="mobile-search"
            type="text"
            autoFocus={showSearch}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Intelligence..."
            className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl px-6 pr-14 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary p-2"
            aria-label="Submit mobile search"
          >
            <Search className="w-6 h-6" aria-hidden="true" />
          </button>
        </form>
      </div>

      {/* Mobile Slide-out Menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-0 left-0 w-full h-[100dvh] bg-white z-[90] flex flex-col transition-transform duration-500 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex-1 overflow-y-auto pt-24 pb-32 px-6">
          <Accordion type="single" collapsible className="w-full">
            {/* News & Insights Accordion */}
            <AccordionItem value="news" className="border-none">
              <AccordionTrigger className="flex items-center gap-4 py-4 px-2 hover:no-underline group">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"
                    aria-hidden="true"
                  >
                    <Search className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                    News & Insights
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-1 ml-14">
                {newsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-primary transition-all"
                  >
                    <item.icon
                      className="w-4 h-4 opacity-60"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-sm">{item.name}</span>
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* About & Company Accordion */}
            <AccordionItem value="about" className="border-none">
              <AccordionTrigger className="flex items-center gap-4 py-4 px-2 hover:no-underline group">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"
                    aria-hidden="true"
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                    About & Company
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-1 ml-14">
                {aboutItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-primary transition-all"
                  >
                    <item.icon
                      className="w-4 h-4 opacity-60"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-sm">{item.name}</span>
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Main Direct Links */}
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-4 py-4 px-2 rounded-xl transition-all group",
                  pathname === link.href
                    ? "bg-primary/5 text-primary"
                    : "text-gray-900 hover:bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    pathname === link.href
                      ? "bg-primary text-white"
                      : "bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"
                  )}
                  aria-hidden="true"
                >
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold">{link.name}</span>
                <ChevronRight
                  className="ml-auto w-5 h-5 text-gray-300"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>

          {/* Secondary Actions */}
          <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
            <button
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary/20 transition-all group"
              aria-label="Subscribe to weekly institutional intelligence"
            >
              <div className="flex items-center gap-3">
                <Mail
                  className="w-5 h-5 text-gray-400 group-hover:text-primary"
                  aria-hidden="true"
                />
                <span className="font-bold text-gray-700">
                  Subscribe to Intel
                </span>
              </div>
              <span
                className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded"
                aria-hidden="true"
              >
                Weekly
              </span>
            </button>
          </div>
        </div>

        {/* Sticky Mobile Footer CTA */}
        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] relative z-[95]">
          <Button
            asChild
            className="w-full h-16 btn-primary rounded-xl text-lg font-bold shadow-xl shadow-primary/20 group"
            aria-label="Initiate BOS link for strategic partnership"
          >
            <Link
              href="/contact"
              className="flex items-center justify-center gap-3"
            >
              Initiate Baalvion Link
              <ChevronRight
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </div>
      <div className="hidden">
        <Lock />
      </div>
    </nav>
  );
}
