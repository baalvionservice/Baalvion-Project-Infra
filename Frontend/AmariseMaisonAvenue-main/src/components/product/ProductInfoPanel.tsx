"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  HelpCircle,
  MessageCircle,
  Mail,
  Plus,
  Minus,
  Info,
  ShieldCheck,
  Gem,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Product } from "@/lib/types";
import { formatMoney, formatProductPrice, normalizeCountry } from "@/lib/i18n/countries";

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Delegates to the canonical 5-market money formatter so US/UK/AE/IN/SG all
// render in their own currency (was a stale map keyed by gb/ch/eu).
export function formatPrice(price: number, countryCode: string): string {
  return formatMoney(price, normalizeCountry(countryCode), { withDecimals: true });
}

// ─── FAQ chips (interactive — each opens a concise answer) ──────────────────
const FAQ_CHIPS: { question: string; answer: string }[] = [
  {
    question: "Is this authentic?",
    answer:
      "Every artifact is authenticated in-house by our specialists and ships with its certificate of authenticity. We never list replicas.",
  },
  {
    question: "What are the materials?",
    answer:
      "Materials, hardware and dimensions are documented in the Description below. For a full material breakdown, our client advisors are happy to assist.",
  },
  {
    question: "Is this considered a rare or collectible?",
    answer:
      "Rarity varies by piece. Limited releases and discontinued references are noted in the Description; contact a curator for provenance and market context.",
  },
];

// At or below this on-hand count we surface scarcity ("Only N left").
const LOW_STOCK_THRESHOLD = 5;

/**
 * Resolve real availability from the product. The storefront API now returns an
 * authoritative `inStock` (commerce-service: trackInventory ? stockQuantity>0 : true);
 * fall back to `stock` when that flag is absent (older payloads / back-compat).
 */
function resolveStock(product: Product): { inStock: boolean; stock: number } {
  const stock = typeof product.stock === "number" ? product.stock : 0;
  const inStockFlag = (product as Product & { inStock?: boolean }).inStock;
  const inStock = typeof inStockFlag === "boolean" ? inStockFlag : stock > 0;
  return { inStock, stock };
}

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

// ─── Provenance Panel ──────────────────────────────────────────────────────
// Surfaces the resale/consignment provenance returned on the product detail:
// condition grade, authenticity guarantee, one-of-a-kind flag, and (when present)
// a deep-link to verify the certificate of authenticity. Renders nothing when the
// product carries no provenance signals.
const CONDITION_GRADE_LABEL: Record<string, string> = {
  pristine: "Pristine",
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
  fair: "Fair",
};

function ProvenancePanel({
  product,
  countryCode,
}: {
  product: Product;
  countryCode: string;
}) {
  const gradeKey = product.conditionGrade
    ? String(product.conditionGrade).toLowerCase()
    : null;
  const gradeLabel = gradeKey
    ? CONDITION_GRADE_LABEL[gradeKey] ?? gradeKey.replace(/_/g, " ")
    : null;
  const isAuthenticated =
    !!product.authenticityCertificateCode ||
    (product.authenticityStatus
      ? ["verified", "authenticated", "certified"].includes(
          String(product.authenticityStatus).toLowerCase()
        )
      : false);
  const certCode = product.authenticityCertificateCode;

  // Nothing to show — keep the panel out of the DOM entirely.
  if (!gradeLabel && !isAuthenticated && !product.isOneOfAKind && !certCode) {
    return null;
  }

  return (
    <div className="border border-gray-200 bg-cream/40 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {gradeLabel && (
          <span className="inline-flex items-center gap-1.5 bg-white border border-gray-300 px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-800">
            <BadgeCheck className="w-3.5 h-3.5 text-plum" />
            {gradeLabel}
          </span>
        )}
        {isAuthenticated && (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Authenticity Guaranteed
          </span>
        )}
        {product.isOneOfAKind && (
          <span className="inline-flex items-center gap-1.5 bg-plum/10 border border-plum/20 px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-plum">
            <Gem className="w-3.5 h-3.5" />
            One of a Kind
          </span>
        )}
      </div>

      {product.conditionDetails?.trim() && (
        <p className="text-[12px] sm:text-[13px] text-gray-600 leading-relaxed italic">
          {product.conditionDetails}
        </p>
      )}

      {certCode && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Certificate&nbsp;
            <span className="font-mono text-gray-800 tracking-wider">{certCode}</span>
          </span>
          <Link
            href={`/${countryCode}/authenticity?code=${encodeURIComponent(certCode)}#verify`}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-plum hover:text-black underline underline-offset-4 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Verify Certificate
          </Link>
        </div>
      )}
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
// Real share URLs built from the current page URL (client-only). Each external network
// opens in a new tab with rel="noopener noreferrer"; Email/SMS use mailto:/sms: schemes.
function ShareIcons({ productName }: { productName: string }) {
  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedText = encodeURIComponent(`${productName} — Amarisé Maison Avenue`);

  const links = [
    {
      label: "Share on Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
      external: true,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
      ),
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      external: true,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      external: true,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      label: "Share via Email",
      href: `mailto:?subject=${encodedText}&body=${encodedUrl}`,
      external: false,
      icon: <Mail className="w-4 h-4" />,
    },
    {
      label: "Share via SMS",
      href: `sms:?&body=${encodedText}%20${encodedUrl}`,
      external: false,
      icon: <MessageCircle className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex items-center gap-5 text-gray-500">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          aria-label={l.label}
          {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="hover:text-gray-900 transition-colors"
        >
          {l.icon}
        </a>
      ))}
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
  const { name, condition, specialNotes } = product;
  const country = normalizeCountry(countryCode);
  const taxNote =
    product.taxType && product.taxRate != null
      ? `${product.taxInclusive ? "Incl." : "Excl."} ${product.taxType.replace("_", " ").toLowerCase()} (${product.taxRate}%)`
      : null;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const { addToCart, toggleWishlist, setCartOpen } = useAppStore();

  const { inStock, stock } = resolveStock(product);
  const isLowStock = inStock && stock > 0 && stock <= LOW_STOCK_THRESHOLD;

  const handleAddToCart = () => {
    // Hard guard: a sold-out artifact can never be added, even if the button is
    // somehow clicked (defence-in-depth alongside the `disabled` attribute).
    if (!inStock) return;
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
        <div className="flex items-baseline gap-3">
          <p className="text-base sm:text-lg text-black tracking-tight tabular-nums leading-none">
            {formatProductPrice(product, country, { withDecimals: true })}
          </p>
          {taxNote && (
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500">
              {taxNote}
            </span>
          )}
        </div>
      </header>

      {/* ── FAQ Chips (interactive) ── */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {FAQ_CHIPS.map((chip) => {
            const isOpen = openFaq === chip.question;
            return (
              <button
                key={chip.question}
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenFaq((cur) => (cur === chip.question ? null : chip.question))}
                className={cn(
                  "flex items-center gap-1.5 border px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] tracking-wide transition-colors",
                  isOpen
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-cream border-cream text-gray-700 hover:border-gray-600"
                )}
              >
                {isOpen ? (
                  <Minus className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <Plus className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="truncate">{chip.question}</span>
              </button>
            );
          })}
        </div>
        {openFaq && (
          <p
            role="status"
            className="bg-cream/60 border-l-2 border-gray-900 px-3 py-2 text-[12px] sm:text-[13px] leading-relaxed text-gray-700"
          >
            {FAQ_CHIPS.find((c) => c.question === openFaq)?.answer}
          </p>
        )}
      </div>

      {/* ── CTA Buttons ── */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            aria-disabled={!inStock}
            className={cn(
              "flex-1 h-12 sm:h-14 py-3 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase transition-colors",
              inStock
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {inStock ? "ADD TO BAG" : "SOLD OUT"}
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

        {/* Availability — driven by real stock (product.inStock / product.stock) */}
        <div className="flex items-start gap-2 text-xs sm:text-[13px]">
          <span
            className={cn(
              "font-bold tracking-[0.15em] whitespace-nowrap",
              inStock ? "text-gray-900" : "text-gray-500"
            )}
          >
            {inStock ? "IN STOCK:" : "SOLD OUT:"}
          </span>
          {inStock ? (
            <span className="text-gray-600 text-xs sm:text-[14px] tracking-wide leading-snug">
              {isLowStock && (
                <span className="font-semibold text-gray-900">
                  Only {stock} left.{" "}
                </span>
              )}
              In stock &amp; available now with FREE Express shipping or pickup at
              our{" "}
              <Link
                href={`/${country}/contact?subject=${encodeURIComponent("Showroom appointment")}`}
                className="underline underline-offset-2 text-gray-800 hover:text-black"
              >
                New York City Showroom
              </Link>
            </span>
          ) : (
            <span className="text-gray-500 text-xs sm:text-[14px] tracking-wide leading-snug">
              This artifact is currently unavailable. Contact our{" "}
              <a
                href="mailto:info@madisonavenuecouture.com"
                className="underline underline-offset-2 text-gray-700 hover:text-black"
              >
                client services team
              </a>{" "}
              to be notified when it returns.
            </span>
          )}
        </div>
      </div>

      {/* ── Condition Matrix ── */}
      <ConditionMatrix condition={condition || "New"} />

      {/* ── Provenance (condition grade, authenticity, one-of-a-kind, certificate) ── */}
      <ProvenancePanel product={product} countryCode={country} />

      {/* ── Accordions ── */}
      <div className="space-y-0">
        <AccordionItem title="Description">
          <p className="whitespace-pre-line">
            {product.description?.trim()
              ? product.description
              : "Detailed description coming soon. Contact our client advisors for the full provenance, materials, and measurements of this piece."}
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
        <Link
          href={`/${country}/contact?subject=${encodeURIComponent(`Question about ${name}`)}`}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gray-900 group"
        >
          <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
          <span className="underline underline-offset-4 decoration-gray-300 group-hover:decoration-gray-900 transition-all">
            Have Questions? Ask An Expert
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600">
            Share:
          </span>
          <ShareIcons productName={name} />
        </div>
      </footer>
    </div>
  );
}
