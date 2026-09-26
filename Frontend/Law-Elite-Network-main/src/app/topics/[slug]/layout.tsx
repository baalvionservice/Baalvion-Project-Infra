import type { Metadata } from 'next';
import { brandTitle } from '@/lib/seo/brand-title';
import { JsonLd, breadcrumbLd } from '@/lib/seo/json-ld';
import { getMergedTopicBySlug } from '@/lib/topics-server';
import { getTopicSlugsWithArticles, isTopicIndexable } from '@/lib/topics-indexing';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getMergedTopicBySlug(slug);
  const url = `${SITE}/topics/${slug}`;

  if (!topic) {
    return { title: `${titleCase(slug)} | Law Elite Network`, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  const title = topic.name;
  const description = topic.description ? topic.description.replace(/\s+/g, ' ').slice(0, 155) : `Articles tagged ${topic.name} on Law Elite Network.`;

  return {
    title: { absolute: brandTitle(`${title} — News & Coverage`) },
    description,
    alternates: { canonical: url },
    robots: { index: isTopicIndexable(topic, await getTopicSlugsWithArticles()), follow: true },
    openGraph: { type: 'website', url, title, description },
    twitter: { card: 'summary', title, description },
  };
}

export default async function TopicLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const topic = await getMergedTopicBySlug(slug);
  if (!topic) return <>{children}</>;
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: topic.name,
          url: `${SITE}/topics/${slug}`,
        }}
      />
      <JsonLd data={breadcrumbLd([{ name: 'Topics', path: '/topics' }, { name: topic.name, path: `/topics/${slug}` }])} />
      {children}
    </>
  );
}
