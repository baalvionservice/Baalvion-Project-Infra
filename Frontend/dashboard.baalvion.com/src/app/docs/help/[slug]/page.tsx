"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocs } from "@/hooks/use-docs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HelpArticlePage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const { helpArticles } = useDocs();
  const article = helpArticles.articles.find((a) => a.slug === slug);

  if (helpArticles.articles.length === 0) return null; // loading
  if (!article) {
    return <main className="container mx-auto max-w-3xl py-12 px-4 text-center text-muted-foreground">Article not found.</main>;
  }

  const paragraphs = article.content.split("\n\n");
  const tip = paragraphs.find((p) => p.startsWith("**Tip:**"));
  const mainContent = paragraphs.filter((p) => !p.startsWith("**Tip:**"));

  return (
    <main className="container mx-auto max-w-3xl py-12 px-4">
      <Link href="/docs/help">
        <Button variant="outline" className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Help Center
        </Button>
      </Link>

      <article>
        <header className="mb-8">
          <Badge variant="secondary" className="mb-2">
            {article.category}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">{article.title}</h1>
          <p className="text-muted-foreground mt-2">
            {article.readingTime} read · Last updated {article.lastUpdated}
          </p>
        </header>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          {mainContent.map((p, i) => (
            <p key={i}>{p}</p>
          ))}

          {tip && (
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle className="font-bold">Tip</AlertTitle>
              <AlertDescription>
                {tip.replace("**Tip:**", "").trim()}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </article>
    </main>
  );
}
