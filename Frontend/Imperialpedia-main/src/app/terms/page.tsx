import { notFound } from "next/navigation";
import { BookMarked } from "lucide-react";
import { Container } from "@/design-system/layout/container";
import { Section } from "@/design-system/layout/section";
import { Text } from "@/design-system/typography/text";
import { buildMetadata } from "@/lib/seo";
import { GLOSSARY_LIVE } from "@/config/glossary";

// Glossary definitions are hand-edited reference content; the 5-minute window
// here regenerated this page 288 times a day to pick up an edit that lands
// every few weeks. Matches term-live.ts's own fetch window.
export const revalidate = 86400;

export const metadata = buildMetadata({
  title: "Financial Term Dictionary — A to Z",
  description:
    "Browse Imperialpedia's full financial dictionary, indexed A–Z. Expert-vetted definitions of investing, banking, economics, crypto, and market terms.",
  canonical: "/terms",
});

export default async function TermsHubPage() {
  if (!GLOSSARY_LIVE) notFound();

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="md">
        <Container>
          <header className="max-w-4xl">
            <div className="flex items-center gap-3 text-primary mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <BookMarked className="h-6 w-6" />
              </div>
              <Text variant="label" className="font-bold tracking-widest uppercase">
                Financial Dictionary
              </Text>
            </div>
            <Text variant="h1" as="h1" className="text-4xl lg:text-7xl font-bold tracking-tight">
              Terms, <span className="text-primary">A to Z</span>
            </Text>
            <Text variant="body" className="mt-6 text-muted-foreground text-xl leading-relaxed max-w-3xl">
              The complete Imperialpedia financial dictionary is coming soon.
            </Text>
          </header>
        </Container>
      </Section>
    </main>
  );
}
