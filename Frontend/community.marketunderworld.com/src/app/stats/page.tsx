import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = { title: 'Platform stats | Market Underworld' };

interface Stats { clubs: number; cities: number; openListings: number; upcomingEvents: number }

async function load(): Promise<Stats | null> {
  const base = process.env.NEXT_PUBLIC_COMMUNITY_API_BASE ?? 'https://api.baalvion.com/api/v1/community';
  try {
    const res = await fetch(`${base}/nightlife/stats`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const body = await res.json();
    return body.success ? (body.data as Stats) : null;
  } catch {
    return null;
  }
}

export default async function StatsPage() {
  const stats = await load();
  const items = stats ? [
    { label: 'Clubs listed', value: stats.clubs },
    { label: 'Cities covered', value: stats.cities },
    { label: 'Open Locals listings', value: stats.openListings },
    { label: 'Upcoming events', value: stats.upcomingEvents },
  ] : [];

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      <main className="container max-w-4xl mx-auto px-6 pt-44 pb-32 space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold">Platform stats</h1>
          <p className="text-text-secondary">Live counts from our database. Nothing here is estimated.</p>
        </header>
        {items.length === 0 ? (
          <p className="text-text-muted">Stats are unavailable right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((i) => (
              <div key={i.label} className="p-6 rounded-lg bg-brand-surface border border-brand-border">
                <div className="text-4xl font-bold font-mono text-white">{i.value.toLocaleString('en-IN')}</div>
                <div className="text-xs uppercase tracking-widest text-text-muted mt-2">{i.label}</div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
