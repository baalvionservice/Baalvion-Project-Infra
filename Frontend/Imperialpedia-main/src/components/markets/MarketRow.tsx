import React from "react";
import Link from "next/link";
import type { MarketAssetRow } from "@/lib/data/marketsLoader";

const CNBC_RED = "#E31937";
const GREEN = "#00A651";

const fmt = (v: number | string | null) => {
  if (v == null) return "—";
  const n = Number(v);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

export function MarketRow({ asset }: { asset: MarketAssetRow }) {
  const price = asset.current_price;
  const pct = asset.change_pct_24h != null ? Number(asset.change_pct_24h) : null;
  const up = (pct ?? 0) >= 0;

  return (
    <Link
      href={`/markets/quote/${asset.symbol}`}
      className="flex items-center justify-between border-b border-white/10 px-3 py-2 hover:bg-white/5 transition-colors"
    >
      <span className="text-[13px] font-semibold tracking-tight text-white truncate" style={{ fontFamily: "Arial Narrow, Arial, sans-serif" }}>
        {asset.name}
      </span>
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="text-[13px] font-mono text-white tabular-nums">{fmt(price)}</span>
        {pct != null && (
          <span
            className="text-[12px] font-bold font-mono tabular-nums"
            style={{ color: up ? GREEN : CNBC_RED }}
          >
            {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
          </span>
        )}
      </div>
    </Link>
  );
}
