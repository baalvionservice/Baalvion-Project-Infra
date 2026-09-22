import { StoryCard } from '@/components/knowledge/news/StoryCard';

/** Articles you have published that name this show or person. Nothing is picked by hand; they connect on their own. */
export function NewsBlock({ articles, title = 'Latest news' }: { articles: any[]; title?: string }) {
  if (!articles || articles.length === 0) return null;
  const sorted = [...articles].sort((a, b) => String(b.publishedAt || b.published_at || b.date || '').localeCompare(String(a.publishedAt || a.published_at || a.date || ''))).slice(0, 6);
  return (
    <section className="mt-12" aria-label={title}>
      <h2 className="border-b-[3px] border-black pb-2 font-headline text-[22px] font-black uppercase text-black">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2">{sorted.map((a) => <StoryCard key={a.slug} article={a} />)}</div>
    </section>
  );
}
