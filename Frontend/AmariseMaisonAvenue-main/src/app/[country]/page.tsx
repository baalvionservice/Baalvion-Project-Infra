"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Heart,
  Star,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import placeholderData from "@/app/lib/placeholder-images.json";
import { VipEmailSignup } from "@/components/home/VipEmailSingup";
import { PRODUCTS } from "@/lib/mock-data";
import { Product } from "@/lib/types";
import { useParams } from "next/navigation";

/* ─────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "NEW ARRIVALS", href: "#" },
  { label: "HERMÈS", href: "#" },
  { label: "CHANEL", href: "#" },
  { label: "GOYARD", href: "#" },
  { label: "OTHER BRANDS", href: "#" },
  { label: "JEWELRY", href: "#" },
  { label: "LIVE SHOP", href: "#" },
  { label: "BLOG", href: "#" },
];

const PRESS_LOGOS = [
  "Business Insider",
  "Barron's",
  "WWD",
  "Bloomberg",
  "Coveteur",
  "New York Post",
  "The Wall Street Journal",
];


const ARRIVAL_TABS = ["Hermès", "Chanel", "Other Brands", "View All"];



/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { country } = useParams();
  const countryCode = (country as string) || "us";

  const [activeTab, setActiveTab] = useState("Hermès");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleWishlist = (id: string) =>
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const heroImage =
    placeholderData.placeholderImages.find(
      (img) => img.id === "home-hero-banner-main"
    )?.imageUrl || "https://picsum.photos/seed/mac-hero/1600/900";

  const authImage =
    placeholderData.placeholderImages.find(
      (img) => img.id === "home-authenticity-banner"
    )?.imageUrl || "https://picsum.photos/seed/mac-auth/900/600";

  const missionImage =
    placeholderData.placeholderImages.find(
      (img) => img.id === "home-mission-banner"
    )?.imageUrl || "https://picsum.photos/seed/mac-mission/900/600";

  const liveImage =
    placeholderData.placeholderImages.find(
      (img) => img.id === "madave-live-section"
    )?.imageUrl || "https://picsum.photos/seed/mac-live/900/600";

  const gridImages = {
    spring:
      placeholderData.placeholderImages.find(
        (img) => img.id === "home-grid-spring"
      )?.imageUrl || "https://picsum.photos/seed/mac-grid-spring/600/750",
    arrivals:
      placeholderData.placeholderImages.find(
        (img) => img.id === "home-grid-arrivals"
      )?.imageUrl || "https://picsum.photos/seed/mac-grid-arrivals/600/750",
    visit:
      placeholderData.placeholderImages.find(
        (img) => img.id === "home-grid-visit"
      )?.imageUrl || "https://picsum.photos/seed/mac-grid-visit/600/750",
  };

  const infoImages = {
    auth:
      placeholderData.placeholderImages.find(
        (img) => img.id === "home-info-auth"
      )?.imageUrl || "https://picsum.photos/seed/mac-info-auth/500/500",
    sell:
      placeholderData.placeholderImages.find(
        (img) => img.id === "home-info-sell"
      )?.imageUrl || "https://picsum.photos/seed/mac-info-sell/500/500",
    showroom:
      placeholderData.placeholderImages.find(
        (img) => img.id === "home-info-showrooms"
      )?.imageUrl || "https://picsum.photos/seed/mac-info-showroom/500/500",
  };

  const visibleProducts =
    activeTab === "View All" ? PRODUCTS : PRODUCTS.slice(0, 4);

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* ── HERO BANNER ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "clamp(380px, 70vh, 780px)" }}
      >
        <Image
          src={heroImage}
          alt="Spring Collection"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 space-y-4">
          <span className="text-[10px] lg:text-[13px] font-semibold tracking-[0.5em] uppercase text-white/90 drop-shadow">
            Newly Curated
          </span>
          <h1 className="text-[42px] sm:text-[60px] lg:text-[80px] xl:text-[96px] font-serif font-normal text-white leading-none tracking-tight drop-shadow-2xl">
            Spring <br /> Collection
          </h1>
          <p className="text-[13px] lg:text-[18px] text-white/85 font-light tracking-wide max-w-sm">
            The season's most coveted pieces
          </p>
          <Link
            href={`/${countryCode}/category/spring-edit`}
            className="mt-4 inline-block bg-white text-black text-[12px] font-bold tracking-[0.4em] uppercase px-10 h-12 leading-[48px] hover:bg-black hover:text-white transition-colors duration-200"
          >
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* ── ANNOUNCEMENT BAR ── */}
      <Link
        href={`/${countryCode}/category/hermes-birkin`}
        className="block bg-[#2b2b2b] hover:bg-black transition-colors duration-200 py-4 px-4 text-center"
      >
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] uppercase text-white">
          Shop our collection of new Hermès Birkin Bags
        </span>
      </Link>

      {/* ── 3-COLUMN CURATORIAL GRID ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <CuratorialCard
            imageUrl={gridImages.spring}
            eyebrow="Van Cleef & Arpels"
            title="Van Cleef & Arpels"
            subtitle="Shop Fine Jewelry"
            href={`/${countryCode}/category/van-cleef`}
          />
          <CuratorialCard
            imageUrl={gridImages.arrivals}
            eyebrow="New"
            title="Hermès New Arrivals"
            subtitle="Just Arrived Bags"
            href={`/${countryCode}/category/hermes`}
          />
          <CuratorialCard
            imageUrl={gridImages.visit}
            eyebrow="Showrooms"
            title="Visit Us"
            subtitle="Shop In Person"
            href={`/${countryCode}/contact`}
          />
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] font-serif font-normal text-gray-900 mb-6 tracking-tight">
            New Arrivals
          </h2>
          {/* Tabs */}
          <div className="flex items-end gap-6 sm:gap-10  w-full max-w-xl justify-center">
            {ARRIVAL_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-3 text-[11px] font-semibold tracking-[0.15em] uppercase transition-all relative whitespace-nowrap outline-none",
                  activeTab === tab
                    ? "text-black"
                    : "text-gray-400 hover:text-gray-700"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="mac-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 lg:gap-x-8 lg:gap-y-14">
          {visibleProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              isWishlisted={wishlist.includes(prod.id)}
              onWishlistToggle={() => toggleWishlist(prod.id)}
              countryCode={countryCode}
            />
          ))}
        </div>

        {/* View All link */}
        <div className="text-center mt-12">
          <Link
            href={`/${countryCode}/category/hermes`}
            className="inline-block text-[11px] font-bold tracking-[0.35em] uppercase text-black border-b-2 border-black pb-1 hover:opacity-60 transition-opacity"
          >
            VIEW ALL NEW ARRIVALS
          </Link>
        </div>
      </section>

      {/* ── 100% AUTHENTICITY DUAL-PANEL ── */}
      <section className="flex flex-col lg:flex-row overflow-hidden">
        {/* Image side */}
        <div
          className="w-full lg:w-1/2 relative"
          style={{ minHeight: "400px" }}
        >
          <Image
            src={authImage}
            alt="100% Authenticity Guarantee"
            fill
            className="object-cover"
          />
        </div>
        {/* Text side */}
        <div className="w-full lg:w-1/2 bg-[#1a1a1a] text-white flex flex-col items-center lg:items-start justify-center px-10 sm:px-16 lg:px-20 xl:px-28 py-16 lg:py-24 space-y-6 text-center lg:text-left">
          {/* Auth badge */}
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <h2 className="text-[30px] sm:text-[38px] lg:text-[48px] font-serif font-normal leading-tight tracking-tight">
            100% Authenticity Guarantee
          </h2>
          <p className="text-[14px] text-gray-300 font-light leading-relaxed max-w-md">
            Every piece is authenticated and certified by our in-house team of
            luxury experts. We stand behind every single item we sell.
          </p>
          <Link
            href={`/${countryCode}/authenticity`}
            className="inline-block mt-2 bg-white text-black text-[10px] font-bold tracking-[0.4em] uppercase px-10 h-12 leading-[48px] hover:bg-gray-100 transition-colors duration-200"
          >
            LEARN MORE
          </Link>
        </div>
      </section>

      {/* ── 3-COLUMN INFO BLOCKS ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-16">
          <InfoBlock
            imageUrl={infoImages.auth}
            title="100% Authenticity Guarantee"
            description="The #1 Trusted Seller of New & Pre-Owned Hermès Bags. Learn about our authentication process."
            href={`/${countryCode}/authenticity`}
          />
          <InfoBlock
            imageUrl={infoImages.sell}
            title="Sell To Us"
            description="Sell or consign your bag to us. Receive a fast quote by our advisors."
            href={`/${countryCode}/sell`}
          />
          <InfoBlock
            imageUrl={infoImages.showroom}
            title="Visit Our Showrooms"
            description="New York City & Palm Beach. Make an appointment, or schedule a virtual showing."
            href={`/${countryCode}/appointments`}
          />
        </div>
      </section>

      {/* ── OUR MISSION ── */}
      <section className="flex flex-col lg:flex-row overflow-hidden border-t border-gray-100">
        {/* Image side */}
        <div
          className="w-full lg:w-1/2 relative order-2 lg:order-1"
          style={{ minHeight: "420px" }}
        >
          <Image
            src={missionImage}
            alt="Our Mission"
            fill
            className="object-cover"
          />
        </div>
        {/* Text side */}
        <div className="w-full lg:w-1/2 order-1 lg:order-2 bg-white flex flex-col justify-center px-10 sm:px-16 lg:px-20 xl:px-28 py-16 lg:py-24 space-y-6">
          <h2 className="text-[26px] sm:text-[32px] lg:text-[38px] font-serif font-normal text-gray-900 tracking-tight">
            Our Mission
          </h2>
          <p className="text-[13px] lg:text-[14px] text-gray-600 font-light leading-[1.85] max-w-lg">
            At Madison Avenue Couture, we specialize in the rare, the iconic,
            and the extraordinary. As the leading U.S. reseller of Hermès and
            Chanel handbags, we offer a curated selection of investment-worthy
            pieces with unmatched access and authenticity.
          </p>
          <p className="text-[13px] lg:text-[14px] text-gray-600 font-light leading-[1.85] max-w-lg">
            We believe in empowering and inspiring women to express themselves
            through fashion, confidence, and bold individuality. Every bag in
            our collection tells a story of heritage, craftsmanship, and
            timeless style.
          </p>
          <Link
            href={`/${countryCode}/about`}
            className="inline-block text-[11px] font-bold tracking-[0.35em] uppercase text-black border-b-2 border-black pb-1 hover:opacity-60 transition-opacity self-start"
          >
            LEARN MORE
          </Link>
        </div>
      </section>

      {/* ── AS SEEN IN (Press Marquee) ── */}
      <section className="py-14 lg:py-20 border-t border-gray-100 overflow-hidden">
        <h2 className="text-[22px] sm:text-[28px] font-serif font-normal text-gray-900 text-center mb-10 tracking-tight">
          As Seen In
        </h2>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 lg:w-40 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 lg:w-40 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex animate-[marquee_28s_linear_infinite] whitespace-nowrap items-center border-y border-gray-100 py-5">
            {[...PRESS_LOGOS, ...PRESS_LOGOS].map((logo, i) => (
              <span
                key={i}
                className="mx-10 lg:mx-16 text-[15px] sm:text-[18px] lg:text-[20px] font-bold uppercase tracking-[0.15em] text-gray-800 opacity-70"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <Link
            href="#"
            className="text-[11px] font-bold tracking-[0.35em] uppercase text-black border-b-2 border-black pb-1 hover:opacity-60 transition-opacity"
          >
            SEE ALL PRESS
          </Link>
        </div>
      </section>


      {/* ── MARQUEE KEYFRAME ── */}
      <style jsx global>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────── */

function CuratorialCard({
  imageUrl,
  eyebrow,
  title,
  subtitle,
  href,
}: {
  imageUrl: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden bg-gray-100"
      style={{ aspectRatio: "3/4" }}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-[4s] ease-out group-hover:scale-105"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      {/* Text */}
      <div className="absolute bottom-5 left-0 right-0 p-6 lg:p-8 space-y-3 text-white text-center">
        <h3 className="text-[18px] sm:text-[20px] lg:text-[28px] tracking-wider font-serif font-normal leading-snug mb-0.5">
          {title}
        </h3>
        <p className="text-[15px] text-white/80 font-light tracking-wide">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

function ProductCard({
  product,
  isWishlisted,
  onWishlistToggle,
  countryCode,
}: {
  product: Product;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  countryCode: string;
}) {
  return (
    <div className="group flex flex-col">
      {/* Image */}
      <Link
        href={`/${countryCode}/product/${product.id}`}
        className="relative overflow-hidden bg-white block"
        style={{ aspectRatio: "4/5" }}
      >
        <Image
          src={product.imageUrl[0]}
          alt={product.name}
          fill
          className="object-contain p-4 sm:p-6 transition-transform duration-[2.5s] ease-out group-hover:scale-105"
        />
        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onWishlistToggle();
          }}
          className="absolute top-3 right-3 p-2  rounded-full transition-all shadow-sm "
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isWishlisted ? "fill-red-500 text-red-500" : "text-black"
            )}
          />
        </button>
      </Link>

      {/* Info */}
      <div className="pt-4 space-y-1.5 text-center">
        <p className="text-[11px] text-gray-500 uppercase tracking-[0.12em] leading-relaxed line-clamp-2 font-light">
          {product.name}
        </p>
        <p className="text-[13px] font-semibold text-gray-900 tracking-wide">
          ${product.basePrice.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function InfoBlock({
  imageUrl,
  title,
  description,
  href,
}: {
  imageUrl: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center text-center group gap-5">
      {/* Square image */}
      <Link
        href={href}
        className="relative w-full overflow-hidden bg-gray-100 block"
        style={{ aspectRatio: "1/1" }}
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
        />
      </Link>

      {/* Text */}
      <div className="space-y-2 max-w-xs">
        <h3 className="text-[15px] lg:text-[17px] font-serif font-normal text-gray-900 leading-snug">
          {title}
        </h3>
        <p className="text-[12px] text-black font-light leading-relaxed">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="text-[10px] tracking-[0.35em] uppercase text-white bg-black px-3 py-4 hover:text-black hover:bg-white hover:border font-bold hover:border-black hover:transition-colors"
      >
        READ MORE
      </Link>
    </div>
  );
}


