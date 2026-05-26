

export interface StockCardProps {
    symbol: string;
    name: string;
    price: number | null;
    timestamp: number | null;
}
export function StockCard({ symbol, name, price, timestamp }: StockCardProps) {
    const isINR = symbol.includes('.NS');
    const currency = isINR ? '₹' : '$';

    let displayTime = 'N/A';
    if (timestamp) {
        const date = new Date(timestamp);

        if (isINR) {
            const istOffset = 5.5 * 60;
            const istDate = new Date(date.getTime() + istOffset * 60 * 1000);
            displayTime = istDate.toLocaleTimeString('en-IN', { hour12: true });
        } else {
            displayTime = date.toLocaleTimeString('en-US', { hour12: true });
        }
    }

    const priceText = price !== null ? `${currency}${price.toFixed(2)}` : 'N/A';
    const priceColor = price === null ? 'text-slate-400' : price >= 0 ? 'text-emerald-600' : 'text-rose-600';

    return (
        <div className="p-4 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-700 truncate" title={name || symbol}>
                        {name || symbol}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{symbol}</p>
                </div>
                <span className={`text-xs font-semibold ${priceColor}`}>{priceText}</span>
            </div>

            <div className="mt-3 text-[10px] text-slate-500 uppercase tracking-wider">Updated:</div>
            <div className="text-xs font-medium text-slate-600">{displayTime}</div>
        </div>
    );
}