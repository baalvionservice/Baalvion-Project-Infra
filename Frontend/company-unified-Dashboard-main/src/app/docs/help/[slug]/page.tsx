import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import helpArticlesData from "@/lib/data/help-articles.json";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = helpArticlesData.articles.find((a) => a.slug === slug);

  if (!article) {
    notFound();
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
