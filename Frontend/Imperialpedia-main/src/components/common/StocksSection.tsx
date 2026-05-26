"use client";

import { useAppQuery } from "@/hooks/useAppQuery";
import { StockCard, StockCardProps } from "../landing/StockCard";
import { StocksSkeleton } from "./StocksSkeleton";

export default function StocksSection() {
    const { data, isLoading, error } = useAppQuery<StockCardProps[]>({
        endpoint: "stocks/latest",
        queryKey: ["stocks", "latest"],
        returnRawData: true,
        refetchInterval: 5000,      // Poll every 5 seconds
        staleTime: 0,               // Consider data old immediately
        refetchOnWindowFocus: true, // Refresh when tab is focused
    });

    const stocks = Array.isArray(data) ? data : [];

    if (isLoading) {
        return <StocksSkeleton />;
    }

    if (error) {
        return (
            <div className="py-4 px-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">Unable to load stocks</p>
                    <p className="text-xs text-red-600 mt-1">{error.message || "Please try refreshing the page"}</p>
                </div>
            </div>
        );
    }

    if (!stocks.length) {
        return (
            <div className="py-4 text-sm text-slate-500">
                No stock data available
            </div>
        );
    }

    return (
        <section className="relative py-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Market Movers</h2>
                <span className="text-xs text-slate-500">Real-time prices</span>
            </div>

            <div className="container flex mx-auto overflow-x-auto gap-3 pb-2 pl-2">
                {stocks.slice(0, 10).map((stock) => (

                    <StockCard
                        symbol={stock.symbol}
                        name={stock.name}
                        price={stock.price}
                        timestamp={stock.timestamp}
                    />
                ))}
            </div>
        </section>
    );
}
