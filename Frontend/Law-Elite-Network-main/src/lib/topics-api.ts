import { fetchPublicApi } from '@/lib/api/public-fetch';
import type { Topic } from '@/data/topics';

interface ApiTopic { slug: string; name: string; pillar?: Topic['pillar']; aliases?: string[]; description?: string; indexable?: boolean }

/** Admin-managed topics plus the slugs an editor archived. Empty when law-service is unreachable, so the site serves its bundled topics. */
export async function fetchApiTopics() {
  const [list, hidden] = await Promise.all([fetchPublicApi('/topics'), fetchPublicApi('/topics/hidden')]);
  const rows: ApiTopic[] = Array.isArray(list?.data) ? list.data : [];
  return {
    topics: rows.map((t): Topic => ({ slug: t.slug, name: t.name, pillar: t.pillar, aliases: t.aliases?.length ? t.aliases : undefined, description: t.description || undefined, indexable: t.indexable })),
    hidden: new Set<string>(Array.isArray(hidden?.data) ? hidden.data : []),
  };
}
