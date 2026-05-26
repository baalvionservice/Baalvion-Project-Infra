"use client";

import { useState } from "react";
import {
  Heart,
  HelpCircle,
  MessageCircle,
  Mail,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Product } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function formatPrice(price: number, countryCode: string): string {
  const map: Record<string, { locale: string; currency: string }> = {
    us: { locale: "en-US", currency: "USD" },
    gb: { locale: "en-GB", currency: "GBP" },
    ch: { locale: "de-CH", currency: "CHF" },
    eu: { locale: "de-DE", currency: "EUR" },
  };
  const { locale, currency } = map[countryCode] ?? map.us;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

// ─── FAQ chips (from the reference site) ────────────────────────────────────
const FAQ_CHIPS = [
  "Is this authentic?",
  "What are the materials?",
  "Is this considered a rare or collectible?",
];

// ─── Condition Matrix ────────────────────────────────────────────────────────
const CONDITIONS = [
  { label: "New", description: "New and never worn" },
  { label: "Never worn", description: "Pristine with original tags" },
];

function ConditionMatrix({ condition }: { condition: string }) {
  const idx = CONDITIONS.findIndex(
    (c) => c.label.toUpperCase() === condition.toUpperCase()
  );
  const active = idx >= 0 ? idx : 0;
  const totalDots = CONDITIONS.length - 1; // segments between dots

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase text-gray-900">
          Condition:
        </span>
        <span className="rounded-lg bg-cream text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 text-gray-700">
          {CONDITIONS[active].label}
        </span>
        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 cursor-pointer" />
      </div>

      {/* Slider track */}
      <div className="relative flex items-center gap-0">
        {/* Full track background */}
        <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-gray-200 -translate-y-1/2" />
        {/* Active fill */}
        <div
          className="absolute inset-y-1/2 left-0 h-px bg-gray-900 -translate-y-1/2 transition-all"
          style={{ width: `${(active / totalDots) * 100}%` }}
        />
        {/* Dots */}
        {CONDITIONS.map((c, i) => (
          <div
            key={c.label}
            className="relative flex flex-col items-center"
            style={{ flex: i < CONDITIONS.length - 1 ? 1 : "0 0 auto" }}
          >
            <div
              className={cn(
                "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 z-10 transition-all",
                i <= active
                  ? "bg-gray-900 border-gray-900"
                  : "bg-white border-gray-300"
              )}
            />
          </div>
        ))}
      </div>

      {/* Labels row */}
      <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-500">
        <span>{CONDITIONS[0].label}</span>
        <span>{CONDITIONS[CONDITIONS.length - 1].label}</span>
      </div>

      {/* Description box */}
      <div className="bg-cream px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-[15px] tracking-wide text-gray-600">
        {CONDITIONS[active].description}
      </div>
    </div>
  );
}

// ─── Simple Accordion ────────────────────────────────────────────────────────
function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-[13px] font-medium tracking-[0.25em] uppercase text-gray-900">
          {title}
        </span>
        {open ? (
          <Minus className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="pb-4 text-[13px] text-gray-600 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Share Icons ─────────────────────────────────────────────────────────────
function ShareIcons() {
  return (
    <div className="flex items-center gap-5 text-gray-500">
      {/* Pinterest */}
      <a
        href="#"
        aria-label="Share on Pinterest"
        className="hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
      </a>
      {/* Facebook */}
      <a
        href="#"
        aria-label="Share on Facebook"
        className="hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>
      {/* WhatsApp */}
      <a
        href="#"
        aria-label="Share on WhatsApp"
        className="hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
      {/* Email */}
      <a
        href="#"
        aria-label="Share via Email"
        className="hover:text-gray-900 transition-colors"
      >
        <Mail className="w-4 h-4" />
      </a>
      {/* SMS / Chat */}
      <a
        href="#"
        aria-label="Share via SMS"
        className="hover:text-gray-900 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
      </a>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductInfoPanel({
  product,
  countryCode = "us",
}: {
  product: Product;
  countryCode?: string;
}) {
  const { name, basePrice, condition, specialNotes } = product;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart, toggleWishlist, setCartOpen } = useAppStore();

  const handleAddToCart = () => {
    addToCart(product);
    setCartOpen(true);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    setIsWishlisted((w) => !w);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <header className="space-y-3 sm:space-y-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-[32px] font-serif font-normal text-gray-900 leading-[1.2] tracking-wide">
          {name}
        </h1>
        <div className="flex items-baseline gap-4">
          <p className="text-base sm:text-lg text-black tracking-tight tabular-nums leading-none">
            {formatPrice(basePrice, countryCode)}
          </p>
        </div>
      </header>

      {/* ── FAQ Chips ── */}
      <div className="flex flex-wrap gap-2">
        {FAQ_CHIPS.map((chip) => (
          <button
            key={chip}
            className="flex bg-cream items-center gap-1.5 border border-cream px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] tracking-wide text-gray-700 hover:border-gray-600 transition-colors"
          >
            <Plus className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{chip}</span>
          </button>
        ))}
      </div>

      {/* ── CTA Buttons ── */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleAddToCart}
            className="flex-1 h-12 sm:h-14 py-3 bg-black text-white text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-gray-800"
          >
            ADD TO BAG
          </button>
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "flex-1 inline-flex py-3 items-center h-12 sm:h-14 border-2 gap-2 border-gray-900 justify-center text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase transition-all",
              isWishlisted
                ? "bg-black text-white"
                : "bg-transparent hover:bg-gray-50"
            )}
            aria-label="Add to Wishlist"
          >
            <Heart
              className={cn("w-4 h-4", isWishlisted && "fill-white text-white")}
            />
            <span className="hidden sm:inline">ADD TO WISHLIST</span>
            <span className="sm:hidden">WISHLIST</span>
          </button>
        </div>

        {/* In Stock */}
        <div className="flex items-start gap-2 text-xs sm:text-[13px]">
          <span className="font-bold tracking-[0.15em] text-gray-900 whitespace-nowrap">
            IN STOCK:
          </span>
          <span className="text-gray-600 text-xs sm:text-[14px] tracking-wide leading-snug">
            In stock &amp; available now with FREE Express shipping or pickup at
            our{" "}
            <a
              href="#"
              className="underline underline-offset-2 text-gray-800 hover:text-black"
            >
              New York City Showroom
            </a>
          </span>
        </div>
      </div>

      {/* ── Condition Matrix ── */}
      <ConditionMatrix condition={condition || "New"} />

      {/* ── Accordions ── */}
      <div className="space-y-0">
        <AccordionItem title="Description">
          <p>
            This Chanel Small 25 Hobo Bag is crafted in ecru canvas with black
            calfskin leather trim and gold-tone hardware. The hobo silhouette
            features a single top handle and an adjustable chain-leather
            shoulder strap, allowing it to be worn multiple ways. The interior
            is lined in burgundy fabric with a zip pocket. Style code:
            AS4361&nbsp;B16963&nbsp;10601. Size: 25 × 19 × 8 cm. Includes full
            set of original packaging, authenticity card, and dust bag.
          </p>
          {specialNotes && (
            <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400">
              <p className="text-sm font-medium text-amber-800">
                Special Notes:
              </p>
              <p className="text-sm text-amber-700 mt-1">{specialNotes}</p>
            </div>
          )}
        </AccordionItem>

        <AccordionItem title="Free Express Shipping">
          <p>
            We offer complimentary express shipping on all orders. Orders placed
            before 2:00&nbsp;PM EST ship same day, Monday through Friday.
            Delivery typically arrives within 1–3 business days domestically and
            3–7 business days internationally. Every shipment is fully insured
            for its complete retail replacement value and includes real-time
            tracking through our secure portal. Signature confirmation is
            required upon delivery.
          </p>
        </AccordionItem>

        <AccordionItem title="Return &amp; Exchange Policy">
          <p>
            We accept returns within 3 days of delivery for store credit or
            exchange. Items must be returned in the exact condition received,
            with all original packaging, authentication cards, and dust bags
            intact. Returns that show signs of use, alteration, or missing
            components will not be accepted. To initiate a return, please
            contact our client services team at{" "}
            <a
              href="mailto:info@madisonavenuecouture.com"
              className="underline"
            >
              info@madisonavenuecouture.com
            </a>{" "}
            within 24 hours of delivery.
          </p>
        </AccordionItem>
      </div>

      {/* ── Footer ── */}
      <footer className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <a
          href="#"
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gray-900 group"
        >
          <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
          <span className="underline underline-offset-4 decoration-gray-300 group-hover:decoration-gray-900 transition-all">
            Have Questions? Ask An Expert
          </span>
        </a>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600">
            Share:
          </span>
          <ShareIcons />
        </div>
      </footer>
    </div>
  );
}
