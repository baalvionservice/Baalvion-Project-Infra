"use client";

import React, { useEffect, useState } from "react";
import { Container } from "@/design-system/layout/container";
import { Article } from "../types";
import { getArticleBySlug } from "../services/content-service";
import { ArticleHeader } from "./ArticleHeader";
import { ArticleBody } from "./ArticleBody";
import { RelatedArticles } from "./RelatedArticles";
import { TableOfContents } from "./TableOfContents";
import { CommunitySection } from "./CommunitySection";
import { Loader2, AlertCircle, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";

interface ArticlePageProps {
  slug: string;
  article?: Article | null;
}

/**
 * Main article page component.
 * Handles data fetching, loading states, and orchestrates header/body/TOC rendering.
 */
export const ArticlePage = ({
  slug,
  article: initialArticle,
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
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <ArticleHeader article={article} />

            {/* Mobile TOC: Collapsible card shown only on mobile/tablet */}
            <div className="lg:hidden mb-8">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <TableOfContents sections={[]} />
                </CardContent>
              </Card>
            </div>

            <ArticleBody sections={[]} />

            <CommunitySection />

            <RelatedArticles
              currentArticleId={article.id}
              category={article.category}
            />
          </div>

          {/* Desktop Sidebar TOC */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <Card className="glass-card shadow-2xl border-none">
                <CardContent className="pt-8">
                  <TableOfContents sections={[]} />
                </CardContent>
              </Card>

              <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                  <Zap className="h-4 w-4" /> Expert insight
                </div>
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed"
                >
                  Join the conversation below to discuss specific tactical
                  executions based on this research node.
                </Text>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-20 pt-8 border-t text-center">
          <Button
            variant="outline"
            className="rounded-xl h-12 px-8 font-bold"
            asChild
          >
            <Link href="/glossary">Explore Full Glossary</Link>
          </Button>
        </div>
      </Container>
    </article>
  );
};
