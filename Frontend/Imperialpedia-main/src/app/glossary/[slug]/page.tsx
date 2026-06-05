import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Volume2, ArrowRight, ArrowLeft, Sigma, BookMarked } from 'lucide-react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { buildMetadata } from '@/lib/seo';
import { env } from '@/config/env';
import {
  getGlossaryTermBySlug,
  type GlossaryTerm,
} from '@/lib/data/glossary';

interface PageParams {
  params: Promise<{ slug: string }>;
}

// Refresh published term detail periodically without freezing it at build time.
export const revalidate = 300;

// Only http/https external links are rendered (no javascript:/data: schemes).
function safeHttpUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

// Split a plain-text definition into paragraphs on blank lines / newlines.
function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .flatMap((block) => block.split(/\n|\r\n/))
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const term = await getGlossaryTermBySlug(slug);
  if (!term) {
    return buildMetadata({
      title: 'Term Not Found',
      description: 'The requested glossary term could not be found.',
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${term.term} — Definition`,
    description: term.short_def || `Definition and explanation of ${term.term}.`,
    canonical: `/glossary/${term.slug}`,
    ogType: 'article',
  });
}

function definedTermJsonLd(term: GlossaryTerm) {
  const baseUrl = env.siteUrl.endsWith('/')
    ? env.siteUrl.slice(0, -1)
    : env.siteUrl;
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.short_def || term.full_def?.slice(0, 300),
    url: `${baseUrl}/glossary/${term.slug}`,
    ...(term.aliases?.length ? { alternateName: term.aliases } : {}),
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Imperialpedia Financial Glossary',
      url: `${baseUrl}/glossary`,
    },
  };
}

/**
 * Public Glossary term detail (Server Component).
 * Renders the definition as escaped text/paragraphs (never raw HTML), shows the
 * LaTeX formula in a styled code block (no KaTeX dependency is present), and
 * links related terms and validated references.
 */
export default async function GlossaryTermPage({ params }: PageParams) {
  const { slug } = await params;
  const term = await getGlossaryTermBySlug(slug);
  if (!term) notFound();

  const paragraphs = toParagraphs(term.full_def || term.short_def || '');
  const references = (term.references ?? [])
    .map((ref) => ({ ...ref, safeUrl: safeHttpUrl(ref.url) }))
    .filter((ref) => ref.safeUrl);
  const examples = term.examples ?? [];
  const relations = term.relations ?? [];

  return (
    <main className="min-h-screen bg-background pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(definedTermJsonLd(term)),
        }}
      />
      <Section spacing="md">
        <Container isNarrow>
          {/* Breadcrumb / back link */}
          <Link
            href="/glossary"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Glossary
          </Link>

          {/* Header */}
          <header className="space-y-5 mb-12">
            <div className="flex flex-wrap items-center gap-3">
              {term.category && (
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold uppercase border-white/10 bg-black/20 text-muted-foreground"
                >
                  {term.category}
                </Badge>
              )}
              {term.difficulty && (
                <Badge className="text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                  {term.difficulty}
                </Badge>
              )}
            </div>

            <Text
              variant="h1"
              className="text-4xl lg:text-6xl font-bold tracking-tight"
            >
              {term.term}
            </Text>

            {term.pronunciation && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Volume2 className="h-4 w-4 text-primary" />
                <Text variant="bodySmall" className="italic" as="span">
                  {term.pronunciation}
                </Text>
              </div>
            )}

            {term.short_def && (
              <Text
                variant="body"
                className="text-muted-foreground text-xl leading-relaxed"
              >
                {term.short_def}
              </Text>
            )}

            {term.aliases && term.aliases.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Text
                  variant="label"
                  as="span"
                  className="text-[10px] text-muted-foreground"
                >
                  Also known as
                </Text>
                {term.aliases.map((alias) => (
                  <Badge
                    key={alias}
                    variant="outline"
                    className="text-[10px] border-white/10 bg-card/40 text-foreground/80"
                  >
                    {alias}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Full definition — escaped text paragraphs only */}
          {paragraphs.length > 0 && (
            <article className="space-y-5 mb-12">
              {paragraphs.map((para, idx) => (
                <Text
                  key={idx}
                  variant="body"
                  className="text-foreground/90 text-lg leading-relaxed"
                >
                  {para}
                </Text>
              ))}
            </article>
          )}

          {/* Formula (LaTeX) — styled code block; no KaTeX dependency present */}
          {term.formula_latex && (
            <section className="mb-12 space-y-3" aria-label="Formula">
              <div className="flex items-center gap-2 text-primary">
                <Sigma className="h-4 w-4" />
                <Text
                  variant="label"
                  as="h2"
                  className="text-[11px] font-bold tracking-widest uppercase"
                >
                  Formula
                </Text>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-card/40 p-6">
                <code className="font-mono text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {term.formula_latex}
                </code>
              </pre>
            </section>
          )}

          {/* Examples */}
          {examples.length > 0 && (
            <section className="mb-12 space-y-5" aria-label="Examples">
              <Text
                variant="h3"
                as="h2"
                className="text-2xl font-bold"
              >
                Examples
              </Text>
              <div className="space-y-4">
                {examples.map((ex, idx) => (
                  <Card key={idx} className="glass-card border-none">
                    <CardContent className="p-6 space-y-2">
                      {ex.title && (
                        <Text variant="bodySmall" weight="bold">
                          {ex.title}
                        </Text>
                      )}
                      {ex.body && (
                        <Text
                          variant="bodySmall"
                          className="text-muted-foreground leading-relaxed"
                        >
                          {ex.body}
                        </Text>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Related terms */}
          {relations.length > 0 && (
            <section className="mb-12 space-y-5" aria-label="Related terms">
              <div className="flex items-center gap-2 text-primary">
                <BookMarked className="h-4 w-4" />
                <Text
                  variant="label"
                  as="h2"
                  className="text-[11px] font-bold tracking-widest uppercase"
                >
                  Related Terms
                </Text>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relations
                  .filter((rel) => rel.related?.slug)
                  .map((rel) => (
                    <Link
                      key={`${rel.relation}-${rel.related.slug}`}
                      href={`/glossary/${rel.related.slug}`}
                      className="flex items-center justify-between p-4 rounded-2xl bg-card/30 border border-white/5 hover:border-primary/30 transition-all group"
                    >
                      <div className="space-y-1">
                        {rel.relation && (
                          <Text
                            variant="label"
                            as="span"
                            className="text-[9px] text-muted-foreground block"
                          >
                            {rel.relation}
                          </Text>
                        )}
                        <Text
                          variant="bodySmall"
                          weight="bold"
                          className="group-hover:text-primary transition-colors"
                        >
                          {rel.related.term}
                        </Text>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* References */}
          {references.length > 0 && (
            <section className="space-y-4" aria-label="References">
              <Text
                variant="label"
                as="h2"
                className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground"
              >
                References
              </Text>
              <ul className="space-y-2">
                {references.map((ref, idx) => (
                  <li key={`${ref.safeUrl}-${idx}`} className="flex gap-2">
                    <span className="text-primary font-mono text-xs pt-0.5">
                      [{idx + 1}]
                    </span>
                    <a
                      href={ref.safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground/80 hover:text-primary transition-colors underline-offset-4 hover:underline break-words"
                    >
                      {ref.title || ref.safeUrl}
                      {ref.kind ? (
                        <span className="text-muted-foreground"> · {ref.kind}</span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Container>
      </Section>
    </main>
  );
}
