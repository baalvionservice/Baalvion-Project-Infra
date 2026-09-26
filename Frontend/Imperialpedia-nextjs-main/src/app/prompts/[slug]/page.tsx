import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { CopyPromptButton } from '@/components/prompts/CopyPromptButton';
import { PromptCard } from '@/components/prompts/PromptCard';
import { PromptSubNav } from '@/components/prompts/PromptSubNav';
import { fetchPromptBySlug, fetchRelatedPrompts, fetchPromptCategories, promptRealImage, isPlaceholderPromptImage } from '@/lib/data/prompts-live';
import { categoryLabel } from '@/config/prompt-categories';
import { buildMetadata } from '@/lib/seo';
import { structuredData } from '@/lib/seo/structured-data';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { Breadcrumbs } from '@/modules/seo-engine/components/Breadcrumbs';
import { breadcrumbService } from '@/modules/seo-engine/services/breadcrumb-service';
import { env } from '@/config/env';
import { Metadata } from 'next';
import { Flame, ExternalLink, Lightbulb, ImageOff } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await fetchPromptBySlug(slug);
  if (!prompt) return buildMetadata({ noIndex: true, title: 'Prompt not found' });

  return buildMetadata({
    canonical: `/prompts/${prompt.slug}`,
    title: prompt.title,
    description: prompt.intro
      ? (prompt.intro.length > 155 ? `${prompt.intro.slice(0, 152)}...` : prompt.intro)
      : `${prompt.items?.length ?? 0} real AI photo editing prompts, tested and ready to copy.`,
    // Falls back to the site default OG image (via buildMetadata) rather than the
    // "EXAMPLE IMAGE PENDING" placeholder while a post's real images aren't uploaded yet.
    ogImage: promptRealImage(prompt)?.url,
    ogType: 'article',
  });
}

export const revalidate = 3600;

export default async function PromptDetailPage({ params }: Props) {
  const { slug } = await params;
  const prompt = await fetchPromptBySlug(slug);
  if (!prompt) notFound();

  const [related, categories] = await Promise.all([
    fetchRelatedPrompts(prompt.category, prompt.slug),
    fetchPromptCategories(),
  ]);
  const base = env.siteUrl.replace(/\/$/, '');
  const realImage = promptRealImage(prompt)?.url;
  const categorySet = new Set(categories);
  const breadcrumb = breadcrumbService.build([
    { name: 'Home', item: '/' },
    { name: 'AI Prompts', item: '/prompts' },
    ...(prompt.category ? [{ name: categoryLabel(prompt.category), item: `/prompts/category/${encodeURIComponent(prompt.category)}` }] : []),
    { name: prompt.title, item: `/prompts/${prompt.slug}` },
  ]);

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <JsonLd data={structuredData.article({
        title: prompt.title,
        description: prompt.intro || `${prompt.items?.length ?? 0} real AI photo editing prompts, tested and ready to copy.`,
        image: realImage || `${base}/logo.png`,
        authorName: 'Imperialpedia Editorial Team',
        datePublished: prompt.createdAt,
        dateModified: prompt.updatedAt,
      })} />
      <PromptSubNav categories={categories} active={prompt.category ?? undefined} />
      <Section spacing="md">
        <Container isNarrow>
          <Breadcrumbs breadcrumb={breadcrumb} />

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {prompt.is_trending && (
              <Badge className="bg-orange-100 text-orange-700 gap-1">
                <Flame size={12} /> Trending
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">{prompt.items?.length ?? 0} prompts inside</span>
          </div>

          <Text variant="h1" as="h1" className="mb-4">{prompt.title}</Text>

          {prompt.intro && (
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed mb-4">
              {prompt.intro}
            </Text>
          )}

          {prompt.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {prompt.tags.map((tag) => (
                categorySet.has(tag) ? (
                  <Link key={tag} href={`/prompts/category/${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="hover:bg-primary/10 cursor-pointer">{tag}</Badge>
                  </Link>
                ) : (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                )
              ))}
            </div>
          )}

          {prompt.items.length > 1 && (
            <nav aria-label="Jump to a prompt" className="mb-10 flex flex-wrap gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-muted/30 p-3">
              {prompt.items.map((item, i) => (
                <a
                  key={i}
                  href={`#prompt-${i + 1}`}
                  className="rounded-full bg-background border border-gray-200 dark:border-gray-800 px-3 py-1 text-xs font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {i + 1}. {item.heading}
                </a>
              ))}
            </nav>
          )}

          <div className="space-y-16">
            {prompt.items.map((item, i) => (
              <article key={i} id={`prompt-${i + 1}`} className="scroll-mt-20 border-t border-gray-200 dark:border-gray-800 pt-10 first:border-0 first:pt-0">
                <Text variant="h2" as="h2" className="mb-2">{i + 1}. {item.heading}</Text>
                {item.subtitle && (
                  <p className="text-muted-foreground mb-4">{item.subtitle}</p>
                )}

                <div className={`grid gap-3 mb-4 ${item.images.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                  {item.images.map((img, j) => (
                    isPlaceholderPromptImage(img.url) ? (
                      <div
                        key={j}
                        className="w-full aspect-[4/3] rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-muted/40 flex flex-col items-center justify-center gap-2 text-center px-6"
                      >
                        <ImageOff size={24} className="text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Example image coming soon</p>
                      </div>
                    ) : (
                      <div
                        key={j}
                        className="w-full max-h-[640px] rounded-xl border border-gray-200 dark:border-gray-800 bg-muted/20 flex items-center justify-center overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.alt || item.heading}
                          className="max-h-[640px] w-auto max-w-full object-contain"
                          loading={i === 0 && j === 0 ? 'eager' : 'lazy'}
                        />
                      </div>
                    )
                  ))}
                </div>
                {item.images.some((img) => img.credit) && (
                  <p className="text-xs text-muted-foreground mb-4">
                    {item.images.filter((img) => img.credit).map((img) => img.credit).join(' · ')}
                  </p>
                )}

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-muted/40 p-4 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Prompt</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{item.prompt_text}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <CopyPromptButton slug={prompt.slug} promptText={item.prompt_text} />
                  {item.model && <Badge variant="outline">{item.model}</Badge>}
                  {item.gemini_url && (
                    <a href={item.gemini_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      Open in Gemini <ExternalLink size={13} />
                    </a>
                  )}
                  {item.chatgpt_url && (
                    <a href={item.chatgpt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      Open in ChatGPT <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          {prompt.pro_tips && (
            <div className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                <Lightbulb size={18} /> Pro Tips
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{prompt.pro_tips}</p>
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-10">
              <Text variant="h3" as="h2" className="mb-5">More {categoryLabel(prompt.category ?? '')} Prompts</Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                {related.map((p) => (
                  <PromptCard key={p.id} prompt={p} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-2 text-sm">
            <Link href="/trending-prompts" className="text-primary hover:underline inline-flex items-center gap-1.5">
              <Flame size={14} /> See what&apos;s trending
            </Link>
            <Link href="/prompts" className="text-primary hover:underline">
              ← Browse the full prompt directory
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
