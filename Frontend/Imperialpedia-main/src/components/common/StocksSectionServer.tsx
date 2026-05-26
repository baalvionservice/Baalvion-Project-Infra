import { StockCard, StockCardProps } from "../landing/StockCard";
import { serverFetch } from "@/hooks/server-fetch";

export default async function StocksSectionServer() {
    const stocks = (await serverFetch<StockCardProps[]>("stocks/latest")) || [];
console.log(stocks)
    if (!stocks.length) {
        return <div className="py-4 text-sm text-muted-foreground">No stock data available</div>;
    }

    return (
        <section className="relative py-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Market Movers</h2>
                <span className="text-xs text-muted-foreground">Real-time prices</span>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-2 pl-2">
                {stocks.slice(0, 10).map((stock) => (
                    <div key={stock.symbol} className="min-w-[220px] max-w-[220px] bg-white/90 border border-slate-200 rounded-xl shadow-sm px-4 py-3 hover:shadow-lg transition-shadow duration-200">
                        <StockCard
                            symbol={stock.symbol}
                            name={stock.name}
                            price={stock.price}
                            timestamp={stock.timestamp}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
