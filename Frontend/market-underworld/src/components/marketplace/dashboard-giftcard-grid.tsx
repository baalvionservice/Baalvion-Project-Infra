"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GiftCardTile } from "@/components/giftcards/giftcard-tile";
import { GiftCardCheckoutModal } from "@/components/giftcards/giftcard-checkout-modal";
import { getCatalog, type GiftCardBrand } from "@/lib/api/giftcards";

const PREVIEW_COUNT = 6;

/**
 * Real, buyable gift-card brands surfaced directly on the dashboard — the same catalog and
 * checkout flow already proven on /marketplace, not a separate mocked product list. Answers the
 * "nothing to buy on the dashboard" gap: previously the dashboard only linked out to /marketplace.
 */
export function DashboardGiftCardGrid({ walletBalance }: { walletBalance?: number }) {
  const [brands, setBrands] = useState<GiftCardBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GiftCardBrand | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    getCatalog().then((data) => {
      setBrands(data.slice(0, PREVIEW_COUNT));
      setLoading(false);
    });
  }, []);

  const openBrand = (brand: GiftCardBrand) => {
    setSelected(brand);
    setModalOpen(true);
  };

  if (!loading && brands.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Shop Gift Cards</h2>
        <Link href="/marketplace" className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">
          View All
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {brands.map((brand) => (
            <GiftCardTile key={brand.slug} brand={brand} onSelect={() => openBrand(brand)} />
          ))}
        </motion.div>
      )}

      <GiftCardCheckoutModal brand={selected} open={modalOpen} onOpenChange={setModalOpen} walletBalance={walletBalance} />
    </section>
  );
}
