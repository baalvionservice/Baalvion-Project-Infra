import { TOPICS } from '@/data/topics';
import type { Topic } from '@/data/topics';
import { fetchApiTopics } from '@/lib/topics-api';
import { overlay } from '@/lib/overlay';

/** Topics as the site shows them: the bundled set overlaid with what editors manage in the admin panel (see overlay). */
export async function getMergedTopics(): Promise<Topic[]> {
  const api = await fetchApiTopics();
  return overlay(TOPICS, api.topics, api.hidden);
}

export async function getMergedTopicBySlug(slug: string): Promise<Topic | null> {
  return (await getMergedTopics()).find((t) => t.slug === slug.toLowerCase()) ?? null;
}
