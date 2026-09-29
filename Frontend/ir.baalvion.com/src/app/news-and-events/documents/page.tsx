import type { Metadata } from 'next';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPublicDocuments, labelize } from '@/lib/ir-public';

export const revalidate = 120;
export const metadata: Metadata = {
  title: 'Investor Documents | Baalvion Investor Relations',
  description: 'Investor presentations, fact sheets, prospectuses and annual reports from Baalvion.',
  alternates: { canonical: '/news-and-events/documents' },
};

export default async function DocumentsPage() {
  const docs = await getPublicDocuments();

  return (
    <div className="animate-in fade-in duration-700">
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Investor Relations</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Investor Documents</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Presentations, fact sheets, prospectuses and other downloadable resources.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        {docs.length === 0 ? (
          <p className="rounded-xl border border-dashed py-20 text-center text-sm text-muted-foreground">No documents published yet. Please check back soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <article key={d.id} className="flex flex-col rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"><FileText className="h-3 w-3" />{labelize(d.documentType)}</span>
                  {d.year && <span className="text-xs text-muted-foreground">{d.year}</span>}
                </div>
                <h3 className="text-base font-semibold leading-snug">{d.title}</h3>
                {d.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{d.description}</p>}
                <div className="mt-4 flex-1" />
                <Button asChild variant="outline" size="sm" className="mt-2 w-fit"><a href={d.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Download</a></Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
