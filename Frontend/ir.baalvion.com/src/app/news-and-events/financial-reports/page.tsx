import type { Metadata } from 'next';
import Script from 'next/script';
import { FileText, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFinancialReports, type FinancialReport } from '@/lib/ir-reports';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Financial Reports | Baalvion Investor Relations',
  description:
    'Quarterly, annual and interim financial reports for Baalvion — published results, highlights and downloadable documents.',
  alternates: { canonical: '/news-and-events/financial-reports' },
  openGraph: {
    title: 'Baalvion Financial Reports',
    description: 'Quarterly, annual and interim financial reports for Baalvion.',
    url: 'https://ir.baalvion.com/news-and-events/financial-reports',
    type: 'website',
  },
};

const TYPE_ORDER: FinancialReport['type'][] = ['annual', 'quarterly', 'interim', 'special'];
const TYPE_HEADINGS: Record<FinancialReport['type'], string> = {
  annual: 'Annual Reports',
  quarterly: 'Quarterly Results',
  interim: 'Interim Reports',
  special: 'Special Reports',
};

function ReportCard({ report }: { report: FinancialReport }) {
  return (
    <article className="group flex flex-col rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          <TrendingUp className="h-3 w-3" />
          {report.period}
        </span>
        {report.publishedAt && (
          <time className="text-xs text-muted-foreground" dateTime={report.publishedAt}>
            {new Date(report.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </time>
        )}
      </div>

      <h3 className="text-lg font-semibold leading-snug">{report.title}</h3>
      {report.summary && (
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{report.summary}</p>
      )}

      {report.highlights.length > 0 && (
        <ul className="mt-3 space-y-1">
          {report.highlights.slice(0, 3).map((h, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex-1" />
      {report.fileUrl ? (
        <Button asChild variant="outline" size="sm" className="mt-2 w-fit">
          <a href={report.fileUrl} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download report
          </a>
        </Button>
      ) : (
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          Document coming soon
        </span>
      )}
    </article>
  );
}

export default async function FinancialReportsPage() {
  const { reports } = await getFinancialReports();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Baalvion Financial Reports',
    url: 'https://ir.baalvion.com/news-and-events/financial-reports',
    itemListElement: reports.slice(0, 20).map((r, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Report',
        name: r.title,
        datePublished: r.publishedAt ?? undefined,
        url: r.fileUrl && r.fileUrl !== '#' ? r.fileUrl : 'https://ir.baalvion.com/news-and-events/financial-reports',
      },
    })),
  };

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    heading: TYPE_HEADINGS[type],
    items: reports.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="animate-in fade-in duration-700">
      <Script id="financial-reports-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Investor Relations</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Financial Reports</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Quarterly, annual and interim results — including key highlights and downloadable
            documents for analysts and shareholders.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No financial reports have been published yet. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map((group) => (
              <div key={group.type}>
                <h2 className="mb-5 text-xl font-semibold">{group.heading}</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((r) => <ReportCard key={r.id} report={r} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
