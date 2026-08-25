"use client";

import React, { useEffect, useState } from "react";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { Container } from "@/design-system/layout/container";
import { Article } from "../types";
import { getArticleBySlug } from "../services/content-service";
import { ArticleHeader } from "./ArticleHeader";
import { ArticleBody } from "./ArticleBody";
import { RelatedArticles } from "./RelatedArticles";
import { SourcesCited } from "./SourcesCited";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { ResolvedAuthor, ArticleFeedbackSummary, ArticleComment, ArticlePoll as ArticlePollData } from "@/services/data/cms-public";
import { HelpfulVote } from "@/components/article/HelpfulVote";
import { CommentsSection } from "@/components/article/CommentsSection";
import { RelatedCalculators } from "@/components/article/RelatedCalculators";
import { WeeklyDigestSignup } from "@/components/article/WeeklyDigestSignup";
import { ArticleQuiz } from "@/components/article/ArticleQuiz";
import { ArticlePoll } from "@/components/article/ArticlePoll";
import { ReadingProgressBar } from "@/components/article/ReadingProgressBar";
import { StickyShareBar } from "@/components/article/StickyShareBar";

interface ArticlePageProps {
  slug: string;
  article?: Article | null;
  /** Full author/reviewer/fact-checker profiles, server-resolved by the route (bio,
   *  credentials, expertise) — powers the Written by/Reviewed by/Fact checked by
   *  byline in ArticleHeader. Undefined when rendered client-side without an
   *  initial article (loading fallback path never has these). */
  author?: ResolvedAuthor | null;
  reviewer?: ResolvedAuthor | null;
  factChecker?: ResolvedAuthor | null;
  /** Absolute canonical URL, for the share-bar links. */
  canonicalUrl?: string;
  feedback?: ArticleFeedbackSummary;
  comments?: ArticleComment[];
  poll?: ArticlePollData | null;
  /** Server-rendered (async) market widgets — passed as pre-rendered nodes since
   *  this component is a client component and can't await a server component itself. */
  marketWidget?: React.ReactNode;
  inlineChart?: React.ReactNode;
  sidebar?: React.ReactNode;
}

/**
 * Main article page component.
 * Handles data fetching, loading states, and renders the header + body.
 */
export const ArticlePage = ({
  slug,
  article: initialArticle,
  author,
  reviewer,
  factChecker,
  canonicalUrl,
  feedback,
  comments,
  poll,
  marketWidget,
  inlineChart,
  sidebar,
}: ArticlePageProps) => {
  const [article, setArticle] = useState<Article | null>(
    initialArticle || null
  );
  const [loading, setLoading] = useState(!initialArticle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if no initial article was provided
    if (initialArticle) {
      setArticle(initialArticle);
      setLoading(false);
      return;
    }

    async function loadArticle() {
      try {
        setLoading(true);
        const response = await getArticleBySlug(slug);

        if (response.data) {
          setArticle(response.data);
        } else {
          setError(response.message || "Article not found");
        }
      } catch (err) {
        setError("An unexpected error occurred while loading the article.");
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [slug, initialArticle]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-[10px]">
          Retrieving financial intelligence...
        </p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <Container className="py-20">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Knowledge Unavailable</AlertTitle>
          <AlertDescription>
            {error || "We couldn't find the requested financial article."}
            <div className="mt-6">
              <Button
                asChild
                variant="outline"
                className="border-destructive/30 hover:bg-destructive/10"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Return Home
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <article className="py-12 lg:py-20">
      <ReadingProgressBar categoryName={article.category} />
      {canonicalUrl && <StickyShareBar url={canonicalUrl} title={article.title} />}
      <Container>
        <div className={sidebar ? "grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px] xl:gap-14" : undefined}>
        <div className="w-full min-w-0 max-w-3xl lg:mx-auto">
          <ArticleHeader article={article} author={author} reviewer={reviewer} factChecker={factChecker} canonicalUrl={canonicalUrl} />

          {(marketWidget || inlineChart) && (
            <div className="mb-8 space-y-4">
              {inlineChart}
              {marketWidget}
            </div>
          )}

          {article.body ? (
            <div
              className="article-body prose prose-lg dark:prose-invert max-w-none mb-12
                prose-headings:font-headline prose-headings:tracking-tight
                prose-p:leading-relaxed prose-p:text-foreground/90
                prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-blockquote:not-italic prose-blockquote:font-medium
                prose-blockquote:border-primary prose-blockquote:text-foreground
                prose-img:rounded-2xl prose-img:border prose-img:border-border prose-img:shadow-md
                prose-li:marker:text-primary prose-hr:border-border"
              // Body is rendered from CMS content blocks (cms-public.blocksToHtml).
              // Source is internal, editor-authored content published via the CMS.
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(article.body) }}
            />
          ) : (
            <ArticleBody sections={[]} />
          )}

          {article.citations?.length ? <SourcesCited citations={article.citations} /> : null}

          {/* "Explore Full Glossary" CTA omitted — /terms is offline pending
              AdSense approval, see src/config/glossary.ts. */}

          <div className="mb-8 space-y-4">
            <RelatedCalculators categorySlug={article.categorySlug} />
            {poll && <ArticlePoll slug={article.slug} initialPoll={poll} categoryName={article.category} />}
            <ArticleQuiz quiz={article.quiz} categoryName={article.category} />
          </div>

          <HelpfulVote slug={article.slug} initialSummary={feedback ?? { helpful: 0, notHelpful: 0 }} categoryName={article.category} />

          <div className="mt-12">
            <CommentsSection slug={article.slug} initialComments={comments ?? []} />
          </div>
        </div>
        {sidebar}
        </div>

        <RelatedArticles
          currentArticleId={article.id}
          category={article.category}
          tags={article.tags}
          categorySlug={article.categorySlug}
        />

        <div className="mt-12">
          <WeeklyDigestSignup categoryName={article.category} />
        </div>
      </Container>
    </article>
  );
};
