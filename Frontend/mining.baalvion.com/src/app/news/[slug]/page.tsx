import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Newspaper, CalendarDays, ArrowLeft, Mail } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { getNewsArticle, companyFacts } from "@/lib/content/store";

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found",
      description: "The requested news article could not be found.",
      alternates: { canonical: `https://mining.baalvion.com/news/${slug}` },
      robots: { index: false, follow: true },
    };
  }

  const description =
    article.seo?.description ??
    article.excerpt ??
    "Company news and media update from Baalvion Mining Inc.";

  return {
    title: article.seo?.title ?? article.title,
    description,
    alternates: { canonical: `https://mining.baalvion.com/news/${slug}` },
    openGraph: {
      title: article.seo?.title ?? article.title,
      description,
      url: `https://mining.baalvion.com/news/${slug}`,
      siteName: "Baalvion Mining Inc.",
      type: "article",
      images: article.coverImage?.url ? [{ url: article.coverImage.url }] : undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = await getNewsArticle(slug);

  // Graceful in-shell "not found" — never a bare 404 screen.
  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="container px-4 md:px-8 max-w-3xl mx-auto py-24 text-center space-y-6">
            <div className="p-4 rounded-2xl bg-slate-100 w-fit mx-auto">
              <Newspaper className="h-10 w-10 text-slate-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              No published news yet
            </h1>
            <p className="text-secondary leading-relaxed max-w-xl mx-auto">
              This article isn&apos;t available. Company news and media releases
              are published as they are issued by management.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/news">
                <Button className="font-bold h-12 px-8 gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to News
                </Button>
              </Link>
              <a href={`mailto:${companyFacts.emails.media}`}>
                <Button
                  variant="outline"
                  className="font-bold h-12 px-8 border-slate-300 text-slate-600 gap-2"
                >
                  <Mail className="h-4 w-4" /> Media Enquiries
                </Button>
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const date = formatDate(article.publishedOn);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <article className="container px-4 md:px-8 max-w-3xl mx-auto py-12 space-y-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Link>

          <header className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              {article.category && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {article.category}
                </Badge>
              )}
              {date && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {date}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary leading-tight">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-lg text-secondary leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </header>

          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-md">
            <Image
              src={article.coverImage?.url ?? BRAND_IMAGES.insight}
              alt={article.coverImage?.alt ?? article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>

          {article.body ? (
            <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-700 leading-relaxed">
              {article.body}
            </div>
          ) : (
            <p className="text-secondary leading-relaxed">
              The full release will appear here once published.
            </p>
          )}

          <footer className="pt-8 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-slate-500">
              For media enquiries, contact{" "}
              <a
                href={`mailto:${companyFacts.emails.media}`}
                className="font-bold text-primary hover:underline"
              >
                {companyFacts.emails.media}
              </a>
            </p>
            <Link href="/news">
              <Button variant="outline" className="font-bold border-slate-300 text-slate-600">
                More News
              </Button>
            </Link>
          </footer>
        </article>
      </main>
      <Footer />
    </div>
  );
}
