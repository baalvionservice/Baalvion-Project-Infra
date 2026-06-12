import { notFound } from 'next/navigation';
import PageRenderer from '@/components/cms/PageRenderer';
import { AppConfig } from '@/config';
import { getIrPage } from '@/lib/ir-pages';
import { IR_FAQ } from '@/lib/ir-faq';

const ORIGIN = AppConfig.baseUrl.replace(/\/$/, '');

interface IrPageProps {
  slug: string;
}

/**
 * Server-rendered shell for an institutional IR route. Resolves the canonical
 * page definition (src/lib/ir-pages.ts), emits BreadcrumbList JSON-LD (plus
 * FAQPage JSON-LD on /faq) and renders the registered section components.
 * Public marketing pages render server-side for SEO; access-gated content
 * continues to flow through the client page-builder.
 */
export default function IrPage({ slug }: IrPageProps) {
  const pageDef = getIrPage(slug);
  if (!pageDef) notFound();

  const breadcrumbLd = buildBreadcrumb(slug, pageDef.title);
  const faqLd = slug === '/faq' ? buildFaqLd() : null;

  return (
    <main className="w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <div className="animate-in fade-in duration-700">
        <PageRenderer page={pageDef} />
      </div>
    </main>
  );
}

function buildBreadcrumb(slug: string, title: string) {
  const segments = slug.split('/').filter(Boolean);
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Investor Relations',
      item: `${ORIGIN}/`,
    },
    ...segments.map((seg, i) => {
      const isLast = i === segments.length - 1;
      const path = `/${segments.slice(0, i + 1).join('/')}`;
      const name = isLast
        ? title
        : seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        '@type': 'ListItem',
        position: i + 2,
        name,
        item: `${ORIGIN}${path}`,
      };
    }),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

function buildFaqLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: IR_FAQ.flatMap((category) =>
      category.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    ),
  };
}
