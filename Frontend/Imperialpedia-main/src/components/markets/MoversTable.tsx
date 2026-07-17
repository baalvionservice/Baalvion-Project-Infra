import React from "react";
import type { MarketAssetRow } from "@/lib/data/marketsLoader";
import { MarketRow } from "./MarketRow";

const CNBC_RED = "#E31937";

export function MoversTable({ gainers, losers }: { gainers: MarketAssetRow[]; losers: MarketAssetRow[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/15 border border-white/15 rounded-sm overflow-hidden">
      <div className="bg-black">
        <div className="px-3 py-1.5 border-b-2" style={{ borderColor: "#00A651" }}>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Top Gainers</h3>
        </div>
        {gainers.map((a) => <MarketRow key={a.symbol} asset={a} />)}
      </div>
      <div className="bg-black">
        <div className="px-3 py-1.5 border-b-2" style={{ borderColor: CNBC_RED }}>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Top Losers</h3>
        </div>
        {losers.map((a) => <MarketRow key={a.symbol} asset={a} />)}
      </div>
    </div>
  );
}
