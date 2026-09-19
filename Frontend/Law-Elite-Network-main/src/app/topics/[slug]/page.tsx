import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getTopicBySlug } from '@/data/topics';
import { getArticlesForEntity, getCoOccurringEntities } from '@/lib/entity-articles';
import { resolveEntityReferences } from '@/lib/entity-reference-resolver';
import { articleUrl } from '@/lib/article-url';

export const revalidate = 86400;

function ChipSection({ title, chips }: { title: string; chips: { name: string; url: string }[] }) {
  if (chips.length === 0) return null;
  return (
    <section className="mb-12">
      <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link key={c.url} href={c.url} className="text-[13.5px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors">
            {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  // Relevance rule: a person/entertainment entity/legal case is "related to"
  // this topic when a real published article connects them both (see
  // getCoOccurringEntities in entity-articles.ts) -- content-driven, not a
  // curated guess, and it strengthens automatically as more articles
  // publish. Empty today because no article yet connects a topic to
  // anything else at once; the mechanism is real and needs no further work.
  const [articles, people, entertainment, legalMatters] = await Promise.all([
    getArticlesForEntity('topic', slug),
    getCoOccurringEntities('topic', slug, { includeTypes: ['person'] }),
    getCoOccurringEntities('topic', slug, { includeTypes: ['entertainment'] }),
    getCoOccurringEntities('topic', slug, { includeTypes: ['legal-case', 'court'] }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Topic</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">{topic.name}</h1>
          </header>

          <section className="mb-12">
            <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-6 pb-2 border-b border-slate-200">Latest News</h2>
            {articles.length === 0 ? (
              <p className="text-[14px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">
                No published articles tagged {topic.name} yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {articles.map((article) => (
                  <li key={article.slug}>
                    <Link href={articleUrl(article)} className="text-[15.5px] font-semibold text-slate-900 hover:text-news-600 transition-colors">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ChipSection title="People" chips={resolveEntityReferences(people)} />
          <ChipSection title="Entertainment" chips={resolveEntityReferences(entertainment)} />
          <ChipSection title="Legal Matters" chips={resolveEntityReferences(legalMatters)} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
