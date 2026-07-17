'use client';

import type { ExchangeStatus } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

export default function ExchangeStatusBar({ exchanges }: { exchanges: ExchangeStatus[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {exchanges.map((ex) => (
        <div key={ex.code} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ borderColor: BORDER }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ex.isOpen ? SUCCESS : DANGER }} />
          <span className="text-[11px] font-medium" style={{ color: TEXT }}>{ex.name}</span>
          <span className="text-[10px] font-semibold uppercase" style={{ color: ex.isOpen ? SUCCESS : DANGER }}>
            {ex.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      ))}
    </div>
  );
}
