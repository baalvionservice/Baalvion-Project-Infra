
export function StocksSkeleton() {
    return (
        <div className="flex w-full overflow-hidden  gap-4 py-4 -mx-4 px-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <article
                    key={index}
                    className="min-w-[220px] max-w-[240px] p-4 rounded-xl bg-slate-100 shadow-sm animate-pulse"
                    aria-hidden="true"
                >
                    <div className="h-4 mb-3 rounded bg-slate-300" />
                    <div className="h-3 mb-2 w-5/6 rounded bg-slate-300" />
                    <div className="h-7 mt-4 rounded bg-slate-300" />
                    <div className="h-3 mt-2 w-2/3 rounded bg-slate-300" />
                </article>
            ))}
        </div>
    );
}
