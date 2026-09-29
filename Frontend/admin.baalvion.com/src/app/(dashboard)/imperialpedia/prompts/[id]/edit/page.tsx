'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { serviceClients } from '@/lib/api/client';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptForm, type PromptValue, type PromptMeta, type PromptImage, type PromptItem } from '@/components/imperialpedia/PromptForm';

interface PromptItemDetail {
  heading: string;
  subtitle?: string | null;
  prompt_text: string;
  model?: string | null;
  images: PromptImage[];
  chatgpt_url?: string | null;
  gemini_url?: string | null;
}

interface PromptDetail {
  id: string;
  slug: string;
  title: string;
  intro?: string | null;
  hero_image?: string | null;
  category?: string | null;
  tags: string[];
  items: PromptItemDetail[];
  pro_tips?: string | null;
  is_trending: boolean;
  trending_order?: number | null;
  status: PromptMeta['status'];
  views_count: number;
  copies_count: number;
}

export default function EditPromptPage() {
  const params = useParams();
  const id = String(params.id);
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Prompts', href: '/imperialpedia/prompts' },
      { label: 'Edit prompt' },
    ]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['imperialpedia', 'prompts', 'detail', id],
    queryFn: () => serviceClients.imperialpedia.get(`/prompts/id/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const prompt = data?.data as PromptDetail | undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (isError || !prompt) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Prompt not found.</p>;
  }

  const items: PromptItem[] = prompt.items?.length
    ? prompt.items.map((it) => ({
      heading: it.heading,
      subtitle: it.subtitle ?? '',
      prompt_text: it.prompt_text,
      model: it.model ?? '',
      images: it.images?.length ? it.images.map((img) => ({ url: img.url, alt: img.alt ?? '', credit: img.credit ?? '' })) : [{ url: '', alt: '', credit: '' }],
      chatgpt_url: it.chatgpt_url ?? '',
      gemini_url: it.gemini_url ?? '',
    }))
    : [{ heading: '', subtitle: '', prompt_text: '', model: '', images: [{ url: '', alt: '', credit: '' }], chatgpt_url: '', gemini_url: '' }];

  const initial: PromptValue = {
    slug: prompt.slug,
    title: prompt.title,
    intro: prompt.intro ?? '',
    hero_image: prompt.hero_image ?? '',
    category: prompt.category ?? '',
    tags: (prompt.tags ?? []).join(', '),
    items,
    pro_tips: prompt.pro_tips ?? '',
    is_trending: prompt.is_trending,
    trending_order: prompt.trending_order ?? '',
  };

  const meta: PromptMeta = {
    id: prompt.id,
    status: prompt.status,
    viewsCount: prompt.views_count,
    copiesCount: prompt.copies_count,
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${prompt.title}`} description="Update this roundup post, its prompts, and trending placement." />
      <PromptForm initial={initial} meta={meta} />
    </div>
  );
}
