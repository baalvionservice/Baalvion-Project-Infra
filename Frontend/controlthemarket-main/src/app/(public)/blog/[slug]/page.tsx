import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getArticleBySlug,
  getFullArticleSlugs,
  CAT_LABELS,
  CAT_STYLES,
  POSTS,
} from '@/components/blog/data';
import { absoluteUrl } from '@/lib/site-url';

type RouteParams = { slug: string };

export function generateStaticParams(): RouteParams[] {
  return getFullArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getArticleBySlug(slug);

  if (!entry) {
    return { title: 'Article not found' };
  }

  const { article } = entry;
  const canonical = absoluteUrl(`/blog/${slug}`);

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: `${article.title} | ControlTheMarket`,
      description: article.excerpt,
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} | ControlTheMarket`,
      description: article.excerpt,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const entry = getArticleBySlug(slug);

  if (!entry) {
    notFound();
  }

  const { article } = entry;
  const related = (article.related || []).slice(0, 3);
  const canonical = absoluteUrl(`/blog/${slug}`);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    articleSection: article.catLabel,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: {
      '@type': 'Organization',
      name: 'ControlTheMarket Editorial Team',
      url: absoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'ControlTheMarket',
      url: absoluteUrl('/'),
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
      { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,96%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="max-w-[820px] mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-green-600 text-[13px] font-semibold mb-7 hover:gap-2.5 transition-all"
        >
          ← Back to blog
        </Link>

        {/* Article header */}
        <header className="mb-9">
          <span
            className={`inline-block text-[10px] font-black uppercase tracking-[1px] px-2.5 py-[3px] rounded-full mb-3 ${CAT_STYLES[article.cat]}`}
          >
            {article.catLabel}
          </span>
          <h1 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-3.5 text-gray-900">
            {article.title}
          </h1>
          <p className="text-base text-gray-500 leading-[1.7] mb-4">{article.excerpt}</p>
          <div className="flex items-center gap-3.5 text-[13px] text-gray-400 flex-wrap">
            <span>📅 {article.date}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-gray-200" />
            <span>⏱ {article.read} read</span>
            <span className="w-[3px] h-[3px] rounded-full bg-gray-200" />
            <span>✍️ ControlTheMarket Editorial Team</span>
          </div>
        </header>

        {/* Banner */}
        <div
          className="h-[200px] sm:h-[280px] rounded-2xl flex items-center justify-center text-[64px] mb-9 overflow-hidden"
          style={{ background: article.color }}
        />

        {/* Article body — trusted, hand-authored static HTML from the data module. */}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Related articles */}
        {related.length > 0 && (
          <nav className="mt-12 pt-8 border-t border-gray-200" aria-label="Related articles">
            <h2 className="text-base font-black mb-5 text-gray-900">Related articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {related.map((rid) => {
                const rp = POSTS.find((p) => p.id === rid);
                if (!rp) return null;
                const hasPage = getArticleBySlug(rid) !== null;
                const cardInner = (
                  <>
                    <h3 className="text-[13px] font-bold mb-1.5 leading-[1.35] text-gray-900">
                      {rp.title}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {rp.read} read · {CAT_LABELS[rp.cat]}
                    </p>
                  </>
                );
                const cardClass =
                  'block bg-white border border-gray-200 rounded-xl p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all';
                return hasPage ? (
                  <Link key={rid} href={`/blog/${rid}`} className={cardClass}>
                    {cardInner}
                  </Link>
                ) : (
                  <div key={rid} className={`${cardClass} opacity-70`}>
                    {cardInner}
                  </div>
                );
              })}
            </div>
          </nav>
        )}
      </article>

      {/* Article body styles (mirrors the in-page ArticleView styling). */}
      <style>{`
        .article-body h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.4px; margin: 32px 0 12px; color: #1c2333; }
        .article-body h3 { font-size: 17px; font-weight: 700; margin: 24px 0 10px; color: #1c2333; }
        .article-body p { font-size: 15px; line-height: 1.85; color: #1c2333; margin-bottom: 16px; }
        .article-body ul, .article-body ol { margin: 0 0 18px 20px; }
        .article-body li { font-size: 15px; line-height: 1.8; margin-bottom: 5px; color: #1c2333; }
        .article-body blockquote { border-left: 3px solid hsl(142,76%,36%); padding: 14px 18px; background: hsl(142,76%,94%); border-radius: 0 8px 8px 0; margin: 24px 0; font-size: 15px; line-height: 1.7; color: hsl(142,76%,22%); }
        .article-body table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .article-body th { background: hsl(220,15%,20%); color: #fff; padding: 10px 14px; text-align: left; font-weight: 700; }
        .article-body td { padding: 9px 14px; border-bottom: 1px solid hsl(220,15%,88%); }
        .article-body tr:nth-child(even) td { background: hsl(220,20%,96%); }
        .article-body .highlight-box { background: hsl(142,76%,94%); border: 1px solid hsl(142,76%,80%); border-radius: 10px; padding: 16px 18px; margin: 20px 0; }
        .article-body .highlight-box strong { color: hsl(142,76%,28%); }
        .art-stat-box { background: hsl(220,15%,90%); border-radius: 16px; padding: 24px; margin: 24px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; text-align: center; }
        .asb-num { font-size: 32px; font-weight: 900; color: hsl(142,76%,36%); letter-spacing: -1px; }
        .asb-lbl { font-size: 12px; color: hsl(220,10%,45%); margin-top: 3px; }
        .art-cta { background: hsl(220,15%,20%); border-radius: 16px; padding: 28px; text-align: center; margin: 36px 0; }
        .art-cta h3 { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px; }
        .art-cta p { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 18px; }
        .read-btn { display: inline-flex; align-items: center; gap: 5px; background: hsl(142,76%,36%); color: #fff; font-size: 15px; font-weight: 600; padding: 11px 24px; border-radius: 8px; text-decoration: none; border: none; cursor: pointer; font-family: inherit; }
        .read-btn:hover { background: hsl(142,76%,28%); }
      `}</style>
    </div>
  );
}
