'use client';

import Link from 'next/link';
import type { RelatedCompany } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';

export default function RelatedCompanies({ companies, websiteId }: { companies: RelatedCompany[]; websiteId: string }) {
  if (companies.length === 0) {
    return <p className="py-4 text-center text-xs" style={{ color: MUTED }}>No tracked peer companies for this symbol yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {companies.map((c) => (
        <Link
          key={c.symbol}
          href={`/cms/websites/${websiteId}/news/quote/${c.symbol}`}
          className="rounded-full border px-2.5 py-1 text-[11px] font-medium hover:bg-white/5"
          style={{ borderColor: BORDER, color: TEXT }}
        >
          {c.name} ({c.symbol})
        </Link>
      ))}
    </div>
  );
}
