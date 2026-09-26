import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Bookmark } from 'lucide-react';
import { groupCategories, categoryLabel, CATEGORY_DESCRIPTIONS } from '@/config/prompt-categories';

interface Props {
  categories: string[];
}

export function PromptHomeContent({ categories }: Props) {
  const groups = groupCategories(categories);

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-muted/20">
      <Container className="py-16 space-y-16">
        {/* Intro */}
        <section className="max-w-3xl mx-auto text-center">
          <Text variant="h2" as="h2" className="mb-4">
            AI Photo Prompts for Viral, Trending &amp; Professional Images
          </Text>
          <div className="space-y-4 text-muted-foreground leading-relaxed text-left">
            <p>
              You saw a striking AI-edited photo somewhere, pasted a prompt you found for it, and got
              something that looked nothing like it. That gap is almost always the prompt itself —
              not the tool, and not you.
            </p>
            <p>
              This is a growing library of AI image-editing prompts for Gemini and ChatGPT, organized
              by season, festival, and style so you can find the exact look you’re after. Every
              prompt here ships with the real example image it produced, plus quick links to open it
              directly in Gemini or ChatGPT.
            </p>
          </div>
        </section>

        {/* Why prompts underperform */}
        <section className="max-w-4xl mx-auto">
          <Text variant="h2" as="h2" className="mb-4 text-center">
            Why AI Prompts Often Underperform
          </Text>
          <p className="text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto mb-8">
            AI image models change often — a prompt that worked well a few months ago can behave
            differently today. A prompt that was never checked against the current model is the most
            common reason for a disappointing result.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2 font-bold text-red-700 dark:text-red-400">
                  <X size={18} /> The Common Problem
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A prompt copied from a random post gives an output that looks nothing like the
                  reference image — often because it names a style (&quot;make me look like a
                  vampire&quot;) instead of describing the light and color a model can actually follow.
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2 font-bold text-emerald-700 dark:text-emerald-400">
                  <Check size={18} /> This Directory&apos;s Approach
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every prompt here specifies exact lighting direction, composition, and color grade
                  rather than vague keywords, and pairs with a real example image so you know what to
                  expect before you paste it.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to use */}
        <section className="max-w-5xl mx-auto">
          <Text variant="h2" as="h2" className="mb-2 text-center">
            How to Use Any Prompt in 4 Steps
          </Text>
          <p className="text-muted-foreground text-center mb-8">No prompting experience required.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: 1, title: 'Browse & Choose', body: 'Find a post that matches the season, festival, or look you want, and check its real example images.' },
              { n: 2, title: 'Copy the Prompt', body: 'Tap Copy Prompt on the exact one you want — the full text is copied to your clipboard instantly.' },
              { n: 3, title: 'Open Gemini or ChatGPT', body: 'Use the Open in Gemini / Open in ChatGPT link, paste the prompt, and upload your own reference photo.' },
              { n: 4, title: 'Generate & Compare', body: 'Generate the result and compare it to the example — output varies by photo, so minor adjustments are normal.' },
            ].map((step) => (
              <Card key={step.n}>
                <CardContent className="p-5">
                  <div className="mb-2 text-sm font-bold text-primary">{step.n}. {step.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground text-center max-w-2xl mx-auto">
            Most prompts produce a usable result on the first or second attempt. Results vary based on
            your source photo and the AI model&apos;s current version.
          </p>
        </section>

        {/* Explore categories by group — Seasons / Festivals & Occasions / People & Style */}
        {groups.length > 0 && (
          <section className="max-w-4xl mx-auto space-y-12">
            <div className="text-center">
              <Text variant="h2" as="h2" className="mb-2">
                Explore Prompt Categories
              </Text>
              <p className="text-muted-foreground">
                Every category below has real, published prompts behind it — organized by season,
                occasion, and who they&apos;re for.
              </p>
            </div>
            {groups.map(({ group, slugs }) => (
              <div key={group.id}>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary">
                  {group.label}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {slugs.map((cat) => (
                    <Link key={cat} href={`/prompts/category/${cat}`} className="block">
                      <Card className="h-full transition-colors hover:border-primary/40">
                        <CardContent className="p-5">
                          <div className="mb-2 font-bold text-foreground">
                            {categoryLabel(cat)} AI Photo Editing Prompts
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {CATEGORY_DESCRIPTIONS[cat] ?? 'Real AI photo editing prompts, each with the example image it produced.'}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Bookmark CTA */}
        <section className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-3 text-primary font-bold">
            <Bookmark size={18} /> Bookmark This Page
          </div>
          <p className="text-muted-foreground leading-relaxed">
            New prompts are added as new looks trend — bookmark this page and check back, or head
            straight to{' '}
            <Link href="/trending-prompts" className="text-primary font-semibold hover:underline">
              Trending Prompts
            </Link>{' '}
            to see what&apos;s featured right now.
          </p>
        </section>
      </Container>
    </div>
  );
}
