'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { serviceClients } from '@/lib/api/client';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { ArticleForm, type ArticleValue, type ArticleMeta } from '@/components/imperialpedia/ArticleForm';

interface ArticleDetail {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  tags?: string[];
  cover_image?: string | null;
  reading_time_min?: number | null;
  author_name?: string | null;
  is_premium?: boolean;
  status: ArticleMeta['status'];
  views_count: number;
  likes_count: number;
}

export default function EditArticlePage() {
  const params = useParams();
  const id = String(params.id);
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Articles', href: '/imperialpedia/articles' },
      { label: 'Edit article' },
    ]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['imperialpedia', 'articles', 'detail', id],
    queryFn: () => serviceClients.imperialpedia.get(`/articles/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const article = data?.data as ArticleDetail | undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (isError || !article) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Article not found.</p>;
  }

  const initial: ArticleValue = {
    title: article.title,
    summary: article.summary ?? '',
    content: article.content ?? '',
    category: article.category ?? '',
    tags: article.tags ?? [],
    cover_image: article.cover_image ?? '',
    reading_time_min: article.reading_time_min ?? 0,
    author_name: article.author_name ?? '',
    is_premium: article.is_premium ?? false,
  };

  const meta: ArticleMeta = {
    id: article.id,
    slug: article.slug,
    status: article.status,
    views_count: article.views_count,
    likes_count: article.likes_count,
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${article.title}`} description="Update this article, including its premium/paywall status." />
      <ArticleForm initial={initial} meta={meta} />
    </div>
  );
}
