'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Loader2 } from 'lucide-react';

// Opens a deal for the logged-in investor and routes into the deal room. If the user isn't
// signed in, the BFF returns 401 → we trigger the IR login modal via ?login=1.
export default function ExpressInterestButton({ opportunityId, companyOrg }: { opportunityId: string; companyOrg?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onClick = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/mp/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId, org_id_company: companyOrg }),
      });
      if (res.status === 401) {
        window.location.href = `/invest/${opportunityId}?login=1`;
        return;
      }
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || json?.error || 'Could not open the deal.');
      router.push(`/invest/deals/${json.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
        {loading ? 'Opening deal…' : 'Express interest'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
