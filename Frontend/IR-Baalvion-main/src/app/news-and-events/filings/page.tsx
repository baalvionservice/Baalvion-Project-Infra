import type { Metadata } from 'next';
import { FileCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPublicFilings, labelize } from '@/lib/ir-public';

export const revalidate = 120;
export const metadata: Metadata = {
  title: 'Regulatory Filings | Baalvion Investor Relations',
  description: 'Baalvion regulatory filings — 10-K, 10-Q, 8-K, proxy statements and prospectuses.',
  alternates: { canonical: '/news-and-events/filings' },
};

export default async function FilingsPage() {
  const filings = await getPublicFilings();

  return (
    <div className="animate-in fade-in duration-700">
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Investor Relations</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Regulatory Filings</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Official filings submitted to regulators — 10-K, 10-Q, 8-K, proxies and prospectuses.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        {filings.length === 0 ? (
          <p className="rounded-xl border border-dashed py-20 text-center text-sm text-muted-foreground">No filings published yet. Please check back soon.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-3">Filing</th><th className="px-4 py-3">Form</th><th className="px-4 py-3">Regulator</th><th className="px-4 py-3">Date</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filings.map((f) => {
                  const url = f.fileUrl || f.externalUrl;
                  return (
                    <tr key={f.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{f.title}{f.description && <p className="text-xs font-normal text-muted-foreground">{f.description}</p>}</td>
                      <td className="px-4 py-3"><span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{f.filingType}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{f.regulator ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.filingDate ? new Date(f.filingDate).toLocaleDateString('en-US', { dateStyle: 'medium' } as any) : '—'}</td>
                      <td className="px-4 py-3 text-right">{url && <Button asChild size="sm" variant="outline"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View</a></Button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><FileCheck className="h-3.5 w-3.5" /> Filings are published from the Baalvion IR admin console.</p>
      </section>
    </div>
  );
}
