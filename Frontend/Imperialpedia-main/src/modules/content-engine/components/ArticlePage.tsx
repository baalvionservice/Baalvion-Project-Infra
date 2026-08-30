"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
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
import { KeyTakeawaysBox } from "@/components/pages/KeyTakeawaysBox";
import { TableOfContents } from "@/components/article/TableOfContents";
import { SavingsGoalWidget } from "@/components/article/SavingsGoalWidget";
import { KeyTermsCallout } from "@/components/article/KeyTermsCallout";
import { getEditorialGuide } from "@/lib/articles/editorial-guides";

interface ArticlePageProps {
  slug: string;
  article?: Article | null;
  author?: ResolvedAuthor | null;
  reviewer?: ResolvedAuthor | null;
  factChecker?: ResolvedAuthor | null;
  canonicalUrl?: string;
  feedback?: ArticleFeedbackSummary;
  comments?: ArticleComment[];
  poll?: ArticlePollData | null;
  marketWidget?: React.ReactNode;
  inlineChart?: React.ReactNode;
  sidebar?: React.ReactNode;
}

const DEFAULT_TAKEAWAYS: Record<string, string[]> = {
  "savings-goals-and-budgeting": [
    "Categorizing savings goals by time horizon (<1 year, 1–5 years, 5+ years) dictates whether capital belongs in an FDIC-insured High-Yield Savings Account, a Certificate of Deposit, or a diversified investment portfolio.",
    "Sinking funds convert erratic and lump-sum annual obligations (car insurance, property taxes, holidays) into predictable monthly budget allocations, eliminating reliance on high-interest credit cards.",
    "Automating transfers on payday ('paying yourself first') dramatically increases savings consistency compared to saving leftover cash at month-end.",
    "Applying structured frameworks like the 50/30/20 budget or Zero-Based Budgeting ensures essential bills, discretionary wants, and wealth accumulation never compete blindly for the same dollars.",
    "Interest earned on high-yield accounts compounds daily or monthly and is taxable as ordinary income reported on IRS Form 1099-INT.",
  ],
};

/**
 * Splits the body HTML so the opening 2 paragraphs (lead) render first,
 * followed by the Key Takeaways Box, followed by the remaining headings and body.
 */
function splitLeadAndBody(html?: string): { leadHtml: string; restHtml: string } {
  if (!html) return { leadHtml: "", restHtml: "" };

  // Find index of first <h2> tag
  const h2Index = html.indexOf("<h2");
  if (h2Index !== -1) {
    return {
      leadHtml: html.slice(0, h2Index),
      restHtml: html.slice(h2Index),
    };
  }

  // Fallback: split after 2nd </p>
  let pCount = 0;
  let splitIndex = -1;
  const pRegex = /<\/p>/gi;
  let match;
  while ((match = pRegex.exec(html)) !== null) {
    pCount++;
    if (pCount === 2) {
      splitIndex = match.index + match[0].length;
      break;
    }
  }

  if (splitIndex !== -1) {
    return {
      leadHtml: html.slice(0, splitIndex),
      restHtml: html.slice(splitIndex),
    };
  }

  return { leadHtml: html, restHtml: "" };
}

/**
 * Main article page component with Investopedia layout & typography:
 * [Sticky Left Table of Contents] | [Center Editorial Content] | [Right Sidebar]
 * Sequence: Title & Byline -> Photo -> 2 Lead Paragraphs -> Key Takeaways -> Body -> Tools
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

  const effectiveArticle = useMemo(() => {
    if (!article) return null;
    const guide = getEditorialGuide(article.slug);
    if (!guide) return article;
    return {
      ...article,
      title: guide.title || article.title,
      body: guide.bodyHtml || article.body,
      keyTakeaways: guide.keyTakeaways || article.keyTakeaways,
      citations: guide.citations || article.citations,
    };
  }, [article]);

  const { leadHtml, restHtml } = useMemo(
    () => splitLeadAndBody(effectiveArticle?.body),
    [effectiveArticle?.body]
  );

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

  if (error || !effectiveArticle) {
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

  const takeaways =
    (effectiveArticle.keyTakeaways && effectiveArticle.keyTakeaways.length > 0)
      ? effectiveArticle.keyTakeaways
      : DEFAULT_TAKEAWAYS[effectiveArticle.slug] || undefined;

  const isSavingsOrBudgeting =
    effectiveArticle.categorySlug === "savings" ||
    effectiveArticle.slug.includes("saving") ||
    effectiveArticle.slug.includes("budget");

  const hasLeftToc = !!effectiveArticle.body;

  return (
    <article className="py-8 lg:py-14">
      <ReadingProgressBar categoryName={effectiveArticle.category} />
      {canonicalUrl && <StickyShareBar url={canonicalUrl} title={effectiveArticle.title} />}
      <Container className="max-w-[1440px] px-4 lg:px-8 xl:px-12">
        {/* 3-COLUMN GRID */}
        <div
          className={`grid grid-cols-1 gap-8 xl:gap-12 relative ${
            hasLeftToc && sidebar
              ? "xl:grid-cols-[200px_1fr_320px] lg:grid-cols-[180px_1fr]"
              : sidebar
              ? "lg:grid-cols-[1fr_320px]"
              : hasLeftToc
              ? "lg:grid-cols-[180px_1fr]"
              : ""
          }`}
        >
          {/* 1. LEFT COLUMN: Table of Contents — starts on photo line, sticks in viewport as you scroll */}
          {hasLeftToc && (
            <div className="hidden lg:block -ml-6 xl:-ml-12 2xl:-ml-16 relative">
              <div className="sticky top-28 self-start mt-[210px] lg:mt-[230px] xl:mt-[250px] max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin z-30">
                <TableOfContents htmlContent={effectiveArticle.body} variant="left-rail" />
              </div>
            </div>
          )}

          {/* 2. CENTER COLUMN: Title + Byline + Photo + Content */}
          <div className="w-full min-w-0">
            {/* Title + Byline + Photo */}
            <ArticleHeader
              article={effectiveArticle}
              author={author}
              reviewer={reviewer}
              factChecker={factChecker}
              canonicalUrl={canonicalUrl}
            />

            {/* Mobile Table of Contents (< lg) */}
            {hasLeftToc && (
              <div className="block lg:hidden mb-6">
                <TableOfContents htmlContent={effectiveArticle.body} variant="inline" />
              </div>
            )}

            {(marketWidget || inlineChart) && (
              <div className="mb-6 space-y-4">
                {inlineChart}
                {marketWidget}
              </div>
            )}

            {/* 2. FIRST 2 OPENING PARAGRAPHS (LEAD) */}
            {leadHtml ? (
              <div
                className="article-body prose prose-lg dark:prose-invert max-w-none mb-8
                  prose-p:text-[17px] sm:prose-p:text-[17.5px] prose-p:leading-[1.85] prose-p:text-[#222222] dark:prose-p:text-gray-200 prose-p:mb-6
                  prose-a:text-[#1d4fc4] dark:prose-a:text-blue-400 prose-a:font-semibold prose-a:underline-offset-2 hover:prose-a:underline
                  prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(leadHtml) }}
              />
            ) : null}

            {/* 3. KEY TAKEAWAYS CALLOUT BOX (Positioned after first 2 paragraphs) */}
            {takeaways && takeaways.length > 0 && (
              <KeyTakeawaysBox items={takeaways} className="my-8" />
            )}

            {/* INTERACTIVE SAVINGS CALCULATOR */}
            {isSavingsOrBudgeting && (
              <SavingsGoalWidget defaultGoal={5000} defaultMonths={12} className="my-8" />
            )}

            {/* 4. REMAINING ARTICLE BODY WITH INVESTOPEDIA-GRADE PROSE TYPOGRAPHY */}
            {restHtml ? (
              <div
                className="article-body prose prose-lg dark:prose-invert max-w-none mb-12
                  prose-headings:font-headline prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:tracking-tight prose-headings:scroll-mt-28
                  prose-h2:text-[22px] prose-h2:sm:text-[24px] prose-h2:mt-12 prose-h2:mb-5 prose-h2:pt-6 prose-h2:border-t prose-h2:border-gray-200 dark:prose-h2:border-gray-700
                  prose-h3:text-[19px] prose-h3:sm:text-[21px] prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-[17px] sm:prose-p:text-[17.5px] prose-p:leading-[1.85] prose-p:text-[#222222] dark:prose-p:text-gray-200 prose-p:mb-6
                  prose-a:text-[#1d4fc4] dark:prose-a:text-blue-400 prose-a:font-semibold prose-a:underline-offset-2 hover:prose-a:underline
                  prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
                  prose-ul:my-5 prose-ul:space-y-3 prose-li:text-[17px] prose-li:leading-[1.78] prose-li:marker:text-gray-800
                  prose-ol:my-5 prose-ol:space-y-3 prose-ol:text-[17px]
                  prose-img:rounded-xl prose-img:border prose-img:border-gray-100 dark:prose-img:border-gray-800"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(restHtml) }}
              />
            ) : !leadHtml ? (
              <ArticleBody sections={[]} />
            ) : null}

            {/* KEY FINANCIAL TERMS DEFINED */}
            <KeyTermsCallout categorySlug={article.categorySlug || "savings"} />

            {/* SOURCES CITED */}
            {article.citations?.length ? <SourcesCited citations={article.citations} /> : null}

            {/* TOOLS & QUIZZES */}
            <div className="mb-8 space-y-4">
              <RelatedCalculators categorySlug={article.categorySlug} />
              {poll && <ArticlePoll slug={article.slug} initialPoll={poll} categoryName={article.category} />}
              <ArticleQuiz quiz={article.quiz} categoryName={article.category} />
            </div>

            {/* HELPFUL VOTE & COMMENTS */}
            <HelpfulVote
              slug={article.slug}
              initialSummary={feedback ?? { helpful: 0, notHelpful: 0 }}
              categoryName={article.category}
            />

            <div className="mt-16 ml-4 lg:ml-8 xl:ml-12">
              <CommentsSection slug={article.slug} initialComments={comments ?? []} />
            </div>
          </div>

          {/* 3. RIGHT COLUMN: Sidebar Modules — pushed to far right */}
          {sidebar && (
            <div className="w-full min-w-0 -mr-2 xl:-mr-6">
              {sidebar}
            </div>
          )}
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
