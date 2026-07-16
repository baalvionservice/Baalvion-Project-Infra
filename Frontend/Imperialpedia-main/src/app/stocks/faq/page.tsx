import Link from "next/link";
import { Metadata } from "next";
import { Container } from "@/design-system/layout/container";
import { Section } from "@/design-system/layout/section";
import { Text } from "@/design-system/typography/text";
import { ArrowLeft } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { getCategoryArticles, listCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticArticleList } from "@/services/data/static-content";
import FAQItem from "@/components/faq/FAQItem";

export const metadata: Metadata = buildMetadata({
  canonical: "/stocks/faq",
  title: "Stock Market FAQ | Imperialpedia",
  description: "Answers to the most common questions about stocks, the stock market, investing strategy, and stock analysis.",
});

export const dynamic = "force-dynamic";

export default async function StocksFaqPage() {
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const { items } = await listCmsContent({ categorySlug: "stocks", contentType: "article", limit: 100 });
    faqSource = items.map(cmsContentToArticle);
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    // Ensure the CMS category exists at all before falling back to the static snapshot.
    await getCategoryArticles("stocks", 1);
    faqSource = staticArticleList().filter((a) => a.category === "Stocks");
  }

  const seen = new Set<string>();
  const faqs = faqSource
    .flatMap((a) => a.faq ?? [])
    .filter((f) => {
      const key = f.question.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <Section spacing="md">
        <Container isNarrow>
          <Link href="/stocks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Stocks
          </Link>

          <Text variant="h1" as="h1" className="mb-4">Stock Market Frequently Asked Questions</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed mb-4">
            {faqs.length} answers pulled straight from Imperialpedia&apos;s stock market guides.
          </Text>
          <p className="text-xs text-muted-foreground mb-12">
            This is general education, not personalized financial advice.
          </p>

          {faqs.length > 0 ? (
            <div className="rounded-2xl border border-border px-4">
              {faqs.map((f) => (
                <FAQItem key={f.question} question={f.question} answer={f.answer} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              No FAQs published yet — check back soon.
            </p>
          )}
        </Container>
      </Section>
    </main>
  );
}
