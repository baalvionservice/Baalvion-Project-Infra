import { TrendingUp } from "lucide-react";

import type { TrendItem } from "@/lib/mock-data";

export function TrendLeaderboard({ items, title }: { items: TrendItem[]; title?: string }) {
  return (
    <div className="glow-card rounded-xl p-6">
      {title && (
        <p className="eyebrow mb-4">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          {title}
        </p>
      )}
      <ol className="space-y-1">
        {items.map((item, index) => (
          <li
            key={item.name}
            className="flex items-center justify-between rounded-md px-2 py-2.5 transition-colors hover:bg-secondary/40"
          >
            <span className="flex items-center gap-3">
              <span className="metric w-5 text-sm text-muted-foreground">{index + 1}</span>
              <span className="font-medium text-foreground">{item.name}</span>
            </span>
            <span className="metric text-sm font-semibold text-signal-positive">+{item.changePct}%</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
