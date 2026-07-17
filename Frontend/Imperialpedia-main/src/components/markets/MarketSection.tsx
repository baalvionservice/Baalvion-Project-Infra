import React from "react";
import type { MarketAssetRow } from "@/lib/data/marketsLoader";
import { MarketRow } from "./MarketRow";

const CNBC_RED = "#E31937";

export function MarketSection({ title, assets }: { title: string; assets: MarketAssetRow[] }) {
  return (
    <div className="bg-black border border-white/15 rounded-sm overflow-hidden">
      <div className="px-3 py-1.5 border-b-2" style={{ borderColor: CNBC_RED }}>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{title}</h3>
      </div>
      {assets.length === 0 ? (
        <p className="px-3 py-4 text-center text-[12px] text-white/40">No data</p>
      ) : (
        assets.map((a) => <MarketRow key={a.symbol} asset={a} />)
      )}
    </div>
  );
}
