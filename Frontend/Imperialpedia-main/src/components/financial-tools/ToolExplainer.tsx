import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import { Card, CardContent } from "@/components/ui/card";
import { getSiteContent } from "@/lib/data/site-content";

export type ToolExplainerContent = {
  toolName: string;
  intro: string;
  formula: string;
  formulaLegend: { symbol: string; meaning: string }[];
  howItWorks: string[];
  example: { title: string; steps: string[]; result: string };
  faq: { question: string; answer: string }[];
};

type Props = { content: ToolExplainerContent };

/**
 * Resolves a tool's explainer content, preferring an admin-managed override
 * (Imperialpedia > Site Content, entity type "financial-tool") over the
 * bundled default. A shallow merge means an admin can override just one
 * field (e.g. only the FAQ) without having to re-supply the formula, legend,
 * and worked example too.
 */
export async function resolveToolExplainerContent(
  slug: string,
  fallback: ToolExplainerContent,
): Promise<ToolExplainerContent> {
  const live = await getSiteContent<Partial<ToolExplainerContent>>("financial-tool", slug);
  return { ...fallback, ...(live ?? {}) };
}

/**
 * Server-rendered educational section appended below each /financial-tools
 * calculator. The calculator itself (its Client component) is an interactive
 * widget with no descriptive copy — this supplies the real formula, a plain-
 * language walkthrough, and a hand-verified worked example so the page has
 * substantive, indexable content independent of user interaction with the
 * form. No FAQPage schema is emitted here (see ARTICLE_STANDARD.md) since
 * this FAQ is generic financial-literacy content, not an editorially-authored
 * entity FAQ.
 */
export function ToolExplainer({ content }: Props) {
  const { toolName, intro, formula, formulaLegend, howItWorks, example, faq } = content;

  return (
    <Container isNarrow>
      <div className="space-y-8 pb-16">
        <Card className="glass-card border-none shadow-xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div>
              <Text variant="h2" as="h2" className="text-2xl font-bold mb-3">
                How the {toolName} Works
              </Text>
              <Text variant="body" className="text-muted-foreground leading-relaxed">
                {intro}
              </Text>
            </div>

            <div className="rounded-xl border border-white/10 bg-background/50 p-5">
              <Text variant="caption" className="text-primary font-bold uppercase tracking-widest mb-2 block">
                Formula
              </Text>
              <code className="block text-sm font-mono text-foreground mb-4">{formula}</code>
              <ul className="space-y-1">
                {formulaLegend.map((item) => (
                  <li key={item.symbol} className="text-sm text-muted-foreground">
                    <span className="font-mono font-semibold text-foreground">{item.symbol}</span> — {item.meaning}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              {howItWorks.map((paragraph, i) => (
                <Text key={i} variant="body" className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </Text>
              ))}
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <Text variant="caption" className="text-primary font-bold uppercase tracking-widest mb-3 block">
                Worked Example: {example.title}
              </Text>
              <ol className="space-y-1.5 list-decimal list-inside">
                {example.steps.map((step, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
              <Text variant="body" className="mt-3 font-semibold text-foreground">
                {example.result}
              </Text>
            </div>
          </CardContent>
        </Card>

        {faq.length > 0 && (
          <Card className="glass-card border-none shadow-xl overflow-hidden">
            <CardContent className="p-8 space-y-5">
              <Text variant="h3" as="h3" className="text-lg font-bold">
                Frequently Asked Questions
              </Text>
              {faq.map((f) => (
                <div key={f.question}>
                  <Text variant="body" className="font-semibold text-foreground">
                    {f.question}
                  </Text>
                  <Text variant="body" className="text-muted-foreground mt-1 leading-relaxed">
                    {f.answer}
                  </Text>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}
