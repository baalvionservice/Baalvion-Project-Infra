"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { COUNTRIES } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";

interface NavLink {
  name: string;
  href: string;
  id: string;
}

const CURRENCIES = [
  { code: "USD", label: "USD", flag: "🇺🇸" },
  { code: "EUR", label: "EUR", flag: "🇪🇺" },
  { code: "GBP", label: "GBP", flag: "🇬🇧" },
  { code: "CHF", label: "CHF", flag: "🇨🇭" },
];

const MEGA_MENU_DATA: Record<string, any> = {
  new: {
    title: "NEW ARRIVALS",
    subtitle: "Shop the latest luxury pieces just in",
    imageId: "mega-new-arrivals",
    collectionHref: "/category/new-arrivals-handbags",
    sections: [
      {
        title: "New Arrivals",
        links: [
          { name: "Hermès", href: "/category/new-arrivals-hermes" },
          { name: "Chanel", href: "/category/new-arrivals-chanel-handbags-and-accessories" },
          { name: "Other Brands", href: "/category/view-all-new-arrivals" },
          { name: "Jewelry", href: "/category/jewelry-new-arrivals" },
        ],
      },
    ],
  },
  hermes: {
    title: "Hermès Bestsellers",
    subtitle: "Rare & pre-owned Hermès in mint condition",
    imageId: "mega-hermes",
    collectionHref: "/category/hermes-handbags",
    sections: [
      {
        title: "Handbags",
        links: [
          { name: "Birkin Bags", href: "/category/hermes-birkin-handbags" },
          { name: "Kelly Bags", href: "/category/hermes-kelly-handbags" },
          { name: "Constance Bags", href: "/category/hermes-constance-handbags" },
          { name: "Evelyne Bags", href: "/category/hermes-evelyne-bags" },
          { name: "Picotin Bags", href: "/category/hermes-picotin-bags" },
          { name: "Lindy Bags", href: "/category/hermes-lindy-bags" },
          { name: "Bolide Bags", href: "/category/hermes-bolide-bags" },
          { name: "Herbag Collection", href: "/category/hermes-herbag-collection" },
          { name: "Pochettes & Kelly Cuts", href: "/category/hermes-clutch" },
          { name: "HSS Special Order Bags", href: "/category/hermes-hss-special-order-bags" },
          { name: "All Hermès Bags", href: "/category/hermes-handbags" },
        ],
      },
      {
        title: "Accessories",
        links: [
          { name: "Wallets", href: "/category/hermes-wallets" },
          { name: "Watches", href: "/category/watches" },
          { name: "Belts", href: "/category/hermes-belts" },
          { name: "Charms", href: "/category/hermes-charms" },
          { name: "Scarves", href: "/category/hermes-scarves" },
          { name: "Shoes", href: "/category/hermes-shoes" },
          { name: "Jewelry", href: "/category/fine-jewelry" },
        ],
      },
      {
        title: "Curations",
        links: [
          { name: "New Arrivals", href: "/category/new-arrivals-handbags" },
          { name: "Best Sellers", href: "/category/hermes-handbags" },
          { name: "Exotic Handbags", href: "/category/hermes-exotic-handbags" },
          { name: "Rare & Unique Bags", href: "/category/hermes-rare-handbags" },
          { name: "HSS Horseshoe Stamp", href: "/category/hermes-hss-special-order-bags" },
          { name: "Pre-Owned & Vintage", href: "/category/hermes-pre-owned-vintage" },
          { name: "Bag Besties & Organizers", href: "/category/bag-besties-organizers" },
        ],
      },
    ],
  },
  chanel: {
    title: "Chanel — Timeless Elegance",
    subtitle: "Authentic pre-owned Chanel classics",
    imageId: "mega-new-arrivals",
    collectionHref: "/category/chanel-bags",
    sections: [
      {
        title: "Handbags",
        links: [
          { name: "Classic Flap Bags", href: "/category/chanel-flap-bags" },
          { name: "Classic Mini Bags", href: "/category/chanel-classic-mini" },
          { name: "Classic Small Bags", href: "/category/chanel-classic-small" },
          { name: "Classic Medium Bags", href: "/category/chanel-classic-medium" },
          { name: "Jumbo & Maxi Flaps", href: "/category/chanel-jumbo-maxi-flaps" },
          { name: "Chanel 22 Bags", href: "/category/chanel-22-bags" },
          { name: "Chanel 25 Bags", href: "/category/chanel-25-bags" },
          { name: "Totes", href: "/category/chanel-tote" },
          { name: "Wallet on Chain", href: "/category/chanel-wallet-on-chain" },
          { name: "Fashion & Runway", href: "/category/chanel-fashion-runway-bags" },
          { name: "All Chanel Bags", href: "/category/chanel-bags" },
        ],
      },
      {
        title: "Accessories",
        links: [
          { name: "Wallets", href: "/category/chanel-wallets" },
          { name: "Shoes", href: "/category/chanel-shoes" },
        ],
      },
      {
        title: "Jewelry",
        links: [
          { name: "Vintage Chanel Jewelry", href: "/category/vintage-chanel-jewelry" },
          { name: "Contemporary", href: "/category/chanel-contemporary-jewelry" },
        ],
      },
      {
        title: "Curations",
        links: [
          { name: "New Arrivals", href: "/category/new-arrivals-chanel-handbags-and-accessories" },
          { name: "Best Sellers", href: "/category/chanel-bags" },
          { name: "Pre-Owned & Vintage", href: "/category/chanel-pre-owned" },
        ],
      },
    ],
  },
  goyard: {
    title: "The Saigon Bag",
    subtitle: "Discover Goyard's iconic collections",
    imageId: "mega-goyard",
    collectionHref: "/category/goyard",
    sections: [
      {
        title: "Handbags",
        links: [
          { name: "Saint Louis", href: "/category/goyard-st-louis-bags" },
          { name: "Saigon", href: "/category/goyard-saigon-bags" },
          { name: "Anjou", href: "/category/goyard-anjou-bags" },
          { name: "Artois", href: "/category/goyard-artois-bags" },
          { name: "Other Styles", href: "/category/goyard-other-styles" },
          { name: "All Goyard Bags", href: "/category/goyard" },
        ],
      },
    ],
  },
  other: {
    title: "Discover Other Luxury Brands",
    subtitle: "Curated selection from top designers",
    imageId: "mega-new-arrivals",
    collectionHref: "/category/other-bags-1",
    sections: [
      {
        title: "Brands",
        links: [
          { name: "The Row", href: "/category/the-row-bags" },
          { name: "Louis Vuitton", href: "/category/louis-vuitton-bags" },
          { name: "Christian Dior", href: "/category/christian-dior-bags" },
          { name: "Fendi", href: "/category/fendi-bags" },
          { name: "Loro Piana", href: "/category/loro-piana-bags" },
          { name: "All Other Brands", href: "/category/other-bags-1" },
        ],
      },
    ],
  },
  jewelry: {
    title: "Van Cleef & Arpels New Arrivals",
    subtitle: "Fine & costume jewelry, vintage & contemporary",
    imageId: "mega-jewelry",
    collectionHref: "/category/jewelry",
    sections: [
      {
        title: "Fine Jewelry",
        links: [
          { name: "Fine Jewelry", href: "/category/fine-jewelry" },
          { name: "Vintage Jewelry", href: "/category/jewelry-vintage" },
          { name: "Contemporary", href: "/category/jewelry-contemporary" },
          { name: "Costume Jewelry", href: "/category/costume-jewelry" },
          { name: "New Arrivals", href: "/category/jewelry-new-arrivals" },
        ],
      },
      {
        title: "Category",
        links: [
          { name: "Earrings", href: "/category/fine-jewelry-earrings" },
          { name: "Bracelets", href: "/category/fine-jewelry-bracelets" },
          { name: "Necklaces", href: "/category/fine-jewelry-necklaces" },
          { name: "Rings", href: "/category/fine-jewelry-rings" },
          { name: "Watches", href: "/category/watches" },
        ],
      },
      {
        title: "Brand",
        links: [
          { name: "Hermès", href: "/category/hermes" },
          { name: "Tiffany & Co.", href: "/category/jewelry" },
          { name: "Van Cleef & Arpels", href: "/category/jewelry" },
          { name: "Chanel Jewelry", href: "/category/chanel" },
        ],
      },
    ],
  },
};

// Promo ticker slides
const TICKER_SLIDES = [
  "Special Notice - Shipments to the Middle East are Running with Delays",
  "Read Our 100% Authenticity Guarantee",
  "Call to schedule an appointment in our NYC Showroom or Virtually via FaceTime",
];

export const Header = () => {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { cart, wishlist, currentUser } = useAppStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [activeCurrency, setActiveCurrency] = useState("USD");
  const [searchQuery, setSearchQuery] = useState("");
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-rotate ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((s) => (s + 1) % TICKER_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const countryCode = (params?.country as string) || "us";
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;

  const cartCount = mounted ? cart.reduce((acc, i) => acc + i.quantity, 0) : 0;
  const wishlistCount = mounted ? wishlist.length : 0;

  const handleCountryChange = (code: string) => {
    router.push(`/${code}`);
  };

  const isAdmin =
    currentUser?.role === "super_admin" ||
    currentUser?.role === "country_admin";

  const navLinks: NavLink[] = [
    {
      id: "new",
      name: "NEW ARRIVALS",
      href: `/${countryCode}/category/new-arrivals-handbags`,
    },
    { id: "hermes", name: "HERMÈS", href: `/${countryCode}/category/hermes-handbags` },
    { id: "chanel", name: "CHANEL", href: `/${countryCode}/category/chanel-bags` },
    { id: "goyard", name: "GOYARD", href: `/${countryCode}/category/goyard` },
    {
      id: "other",
      name: "OTHER BRANDS",
      href: `/${countryCode}/category/other-bags-1`,
    },
    {
      id: "jewelry",
      name: "JEWELRY",
      href: `/${countryCode}/category/fine-jewelry`,
    },
    { id: "live", name: "LIVE SHOP", href: `/${countryCode}/sell` },
    { id: "journal", name: "BLOG", href: `/${countryCode}/journal` },
  ];

  const handleNavEnter = (id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredLink(id);
  };

  const handleNavLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 120);
  };

  const handleMegaEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const popularSearches = ["Birkin", "Hermès", "Kelly"];

  return (
    <>
      {/* ─── LAYER 1: Announcement / Promo Ticker ─── */}
      <div className="bg-cream text-black hidden sm:block">
        <div className="flex items-center justify-center h-7 px-4 gap-4">
          <button
            className="opacity-50 hover:opacity-100 transition-opacity p-1"
            onClick={() =>
              setActiveSlide((s) =>
                s === 0 ? TICKER_SLIDES.length - 1 : s - 1
              )
            }
            aria-label="Previous"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          <div className="overflow-hidden relative flex items-center justify-center min-w-[240px] sm:min-w-[460px] lg:min-w-[640px]">
            <AnimatePresence mode="wait">
              <motion.a
                key={activeSlide}
                href="#"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-[10px] sm:text-[11px] tracking-[0.18em] font-medium uppercase text-center block hover:underline"
              >
                {TICKER_SLIDES[activeSlide]}
              </motion.a>
            </AnimatePresence>
          </div>

          <button
            className="opacity-50 hover:opacity-100 transition-opacity p-1"
            onClick={() =>
              setActiveSlide((s) => (s + 1) % TICKER_SLIDES.length)
            }
            aria-label="Next"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ─── LAYER 2: Top Utility Bar ─── */}
      {/* Desktop only */}
      <div className="hidden lg:block bg-[#1a1a1a]">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-9">
          <Link className="text-white" href={`/${countryCode}/about`}>
            100% Authentic Guaranteed
          </Link>
          <div className="flex items-center">
            <a
              href={`/${countryCode}/how-to-sell`}
              className="text-[12px] tracking-[0.14em]  text-white hover:text-white transition-colors font-medium px-5"
            >
              Sell
            </a>
            <a
              href={`/${countryCode}/appointments`}
              className="text-[12px] tracking-[0.14em]  text-white hover:text-white transition-colors font-medium px-5"
            >
              Appointments
            </a>
            <a
              href={`/${countryCode}/contact`}
              className="text-[12px] tracking-[0.14em]  text-white hover:text-white transition-colors font-medium px-5"
            >
              Contact
            </a>

            {/* Currency switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-white/70 hover:text-white transition-colors font-medium pl-5 bg-transparent border-none outline-none cursor-pointer">
                  <span className="text-sm leading-none">
                    {CURRENCIES.find((c) => c.code === activeCurrency)?.flag}
                  </span>
                  <span>{activeCurrency}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white border border-gray-100 rounded-none shadow-lg min-w-[110px] p-1"
              >
                {CURRENCIES.map((c) => (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => setActiveCurrency(c.code)}
                    className={cn(
                      "cursor-pointer rounded-none text-[11px] font-medium tracking-wider uppercase flex items-center gap-2 py-2",
                      activeCurrency === c.code
                        ? "bg-black text-white"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ─── LAYER 3: Brand Core (Sticky) ─── */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        {/* Brand Row */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px] lg:h-[70px] gap-4">
            {/* LEFT: Mobile hamburger + wishlist / Desktop: empty spacer */}
            <div className=" flex lg:hidden items-center gap-2 min-w-[120px] lg:min-w-[200px]">
              {/* Mobile hamburger */}
              <div className="lg:hidden">
                {mounted && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <button
                        className="p-2 text-black hover:bg-gray-50 transition-colors rounded-sm"
                        aria-label="Open menu"
                      >
                        <Menu className="w-5 h-5" />
                      </button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-[88%] gap-0 sm:max-w-[420px] p-0 bg-white border-none rounded-none flex flex-col h-full shadow-2xl"
                    >
                      {/* Close button row */}
                      <div className="flex items-center px-3 py-2">
                        <SheetClose asChild>
                          <button className="py-1 -ml-1 hover:bg-gray-50 rounded-sm transition-colors">
                            <X className="w-6 h-6 stroke-1 text-black" />
                          </button>
                        </SheetClose>
                      </div>

                      <div className="flex-1 divide-y space-y-3 divide-gray-400 px-2 overflow-y-auto">
                        {/* Primary nav links */}
                        <nav className="">
                          {navLinks.map((link) => (
                            <SheetClose asChild key={link.id}>
                              <Link
                                href={link.href}
                                className="flex items-center justify-between py-[12px] text-[13px] tracking-[0.12em] uppercase text-black hover:text-gray-500 transition-colors"
                              >
                                {link.name}
                                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                              </Link>
                            </SheetClose>
                          ))}
                        </nav>

                        {/* Secondary links */}
                        <nav>
                          {[
                            {
                              label: "SELL TO US",
                              href: `/${countryCode}/how-to-sell`,
                            },
                            {
                              label: "Appointments",
                              href: `/${countryCode}/appointments`,
                            },
                            {
                              label: "Shipping",
                              href: `/${countryCode}/shipping`,
                            },
                            {
                              label: "Return Policy",
                              href: `/${countryCode}/return-policy`,
                            },
                            { label: "FAQ", href: `/${countryCode}/faq` },
                            {
                              label: "Authenticity Guarantee",
                              href: `/${countryCode}/authenticity`,
                            },
                            {
                              label: "Contact",
                              href: `/${countryCode}/contact`,
                            },
                          ].map(({ label, href }) => (
                            <SheetClose asChild key={label}>
                              <Link
                                href={href}
                                className="flex items-center py-[12px] text-[13px] text-gray-700 hover:text-black transition-colors"
                              >
                                {label}
                              </Link>
                            </SheetClose>
                          ))}
                        </nav>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>

              {/* Mobile: wishlist next to hamburger */}
              <Link
                href={`/${countryCode}/wishlist`}
                className="relative p-2 lg:hidden hover:bg-gray-50 rounded-sm transition-colors"
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-colors",
                    wishlistCount > 0 ? "fill-black text-black" : "text-black"
                  )}
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </div>

            <div className="hidden lg:flex space-x-2 text-gray-600 text-[12px]">
              <Link href={`/${countryCode}/account/login`}>Log In</Link>
              <span>|</span>
              <Link href={`/${countryCode}/account/register`}>Sign Up</Link>
            </div>

            {/* CENTER: Logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href={`/${countryCode}`} className="block text-center">
                <span className="text-[14px] sm:text-[22px] lg:text-[28px] font-bold tracking-[0.1em] uppercase text-black leading-none font-serif">
                Amarisé Maison
                </span>
              </Link>
            </div>

            {/* RIGHT: search / wishlist / cart */}
            <div className="flex items-center gap-4 min-w-[120px] lg:min-w-[200px] justify-end">
              {/* Search button — icon + text + border-b on desktop */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
                className="flex items-center gap-1.5 md:w-24 text-black hover:opacity-70 md:border-b md:border-black transition-opacity"
              >
                <Search className="w-5 h-5 stroke-[1.5] md:mb-1 md:h-3 md:w-3" />
                <span className="hidden lg:block text-[12px] font-normal  pb-px tracking-wide">
                  Search
                </span>
              </button>

              {/* Wishlist (desktop) */}
              <Link
                href={`/${countryCode}/wishlist`}
                className="relative p-2 hidden lg:flex hover:opacity-70 transition-opacity"
                aria-label="Wishlist"
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-colors stroke-1",
                    wishlistCount > 0 ? "fill-black text-black" : "text-black"
                  )}
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href={`/${countryCode}/cart`}
                className="relative p-2 hover:opacity-70 transition-opacity"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5  stroke-1 text-black" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ─── LAYER 4: Main Nav (Desktop) ─── */}
        <nav
          className="hidden lg:block  relative"
          onMouseLeave={handleNavLeave}
        >
          <div className="max-w-[1400px] mx-auto px-8">
            <ul className="flex items-center justify-center h-11">
              {navLinks.map((link) => (
                <li
                  key={link.id}
                  className="h-full flex items-center"
                  onMouseEnter={() => handleNavEnter(link.id)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "relative h-full flex items-center px-4 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors duration-150",
                      hoveredLink === link.id
                        ? "text-black"
                        : "text-black hover:text-black"
                    )}
                  >
                    {link.name}
                    {/* Underline indicator */}
                    <span
                      className={cn(
                        "absolute bottom-0 left-3 right-3 h-[2px] bg-black transition-all duration-300 origin-center",
                        hoveredLink === link.id
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0"
                      )}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Mega Menu ─── */}
          <AnimatePresence>
            {hoveredLink && MEGA_MENU_DATA[hoveredLink] && (
              <motion.div
                ref={megaMenuRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="absolute top-full left-0 right-0 w-full bg-white border-t border-gray-100 shadow-xl z-[60]"
                onMouseEnter={handleMegaEnter}
                onMouseLeave={handleNavLeave}
              >
                <div className="max-w-[1100px] mx-auto px-8 py-10">
                  <div
                    className={cn(
                      "grid gap-10",
                      MEGA_MENU_DATA[hoveredLink].sections.length >= 4
                        ? "grid-cols-5":
                        MEGA_MENU_DATA[hoveredLink].sections.length >= 3
                        ? "grid-cols-4":
                        MEGA_MENU_DATA[hoveredLink].sections.length >= 2
                        ? "grid-cols-3":
                        "grid-cols-2"
                    )}
                  >
                    {/* Link columns */}
                    {MEGA_MENU_DATA[hoveredLink].sections.map(
                      (section: any, idx: number) => (
                        <div key={idx}>
                          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-900 mb-4 pb-2 border-b border-gray-100">
                            {section.title}
                          </p>
                          <ul className="space-y-2">
                            {section.links.map((sub: any, sIdx: number) => (
                              <li key={sIdx}>
                                <Link
                                  href={`/${countryCode}${sub.href}`}
                                  onClick={() => setHoveredLink(null)}
                                  className="text-[13px] text-gray-500 hover:text-black transition-colors block py-0.5"
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}

                    {/* Featured image column */}
                    <div className="flex flex-col gap-4">
                      <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden">
                        <Image
                          src={
                            placeholderData.placeholderImages.find(
                              (i) =>
                                i.id === MEGA_MENU_DATA[hoveredLink].imageId
                            )?.imageUrl || ""
                          }
                          alt={MEGA_MENU_DATA[hoveredLink].title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <h5 className="text-[13px] font-bold uppercase tracking-[0.15em] text-gray-900 leading-snug">
                          {MEGA_MENU_DATA[hoveredLink].title}
                        </h5>
                        <p className="text-[11px] text-gray-400 mt-0.5 italic">
                          {MEGA_MENU_DATA[hoveredLink].subtitle}
                        </p>
                      </div>
                      <Link
                        href={`/${countryCode}${MEGA_MENU_DATA[hoveredLink].collectionHref}`}
                        onClick={() => setHoveredLink(null)}
                        className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-black border-b border-black pb-0.5 hover:opacity-60 transition-opacity w-fit"
                      >
                        Shop All
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>

      {/* ─── SEARCH OVERLAY ─── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            {/* Search header */}
            <div className="flex items-center border-b border-gray-100 px-6 lg:px-12 h-16 lg:h-20 gap-4">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-base lg:text-xl font-medium text-gray-900 placeholder:text-gray-300 outline-none"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-2 hover:bg-gray-50 rounded-sm transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-black" />
              </button>
            </div>

            {/* Search body */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 max-w-[800px] mx-auto w-full">
              {/* Popular searches */}
              <div className="mb-8">
                <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400 mb-4">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-4 py-2 border border-gray-200 text-[12px] font-medium tracking-wider uppercase text-gray-600 hover:border-black hover:text-black transition-colors rounded-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending placeholder */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400 mb-4">
                  Trending
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    "Vintage Hermès Kelly",
                    "Birkin 25",
                    "Fauve Barenia",
                    "Rouge Sellier Epsom",
                    "Micro Picotin Lock",
                    "Kelly Cut Biscuit",
                    "Kelly Sellier 20 Black",
                    "Birkin 30 Rouge H",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => setSearchQuery(item)}
                      className="text-left group"
                    >
                      <div className="aspect-square bg-gray-50 mb-2 group-hover:bg-gray-100 transition-colors" />
                      <p className="text-[11px] text-gray-700 group-hover:text-black transition-colors leading-snug">
                        {item}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
