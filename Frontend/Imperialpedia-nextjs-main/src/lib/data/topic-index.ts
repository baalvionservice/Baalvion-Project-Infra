/**
 * @fileOverview Builds the Global Topic Index (the `/topics` and `/learning-paths` hubs)
 * from the real glossary dataset instead of a hardcoded fake topic list.
 *
 * Source of truth: `fetchAllTerms()` (`@/lib/data/term-live`) — the same live-first,
 * static-fallback term data that already powers the live `/terms/[letter]/[slug]` pages.
 * Every topic produced here carries a real slug, so every link this page renders resolves
 * to a real term page. Fields the real `Term` type has no equivalent for (difficulty,
 * reading time, popularity) are derived deterministically from the term's own real content
 * rather than fabricated — see the helpers below for exactly how.
 */
import { fetchAllTerms } from './term-live';
import { getTermUrl } from './utils';
import type { Term, TermsBodyBlock } from './terms';
import type {
  GlobalTopicIndexData,
  TopicNode,
  LearningPath,
  TopicDifficulty,
} from '@/types/topics';

const WORDS_PER_MINUTE = 200;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function segmentWordCount(seg: { type: string; content: unknown }): number {
  if (typeof seg.content === 'string') return countWords(seg.content);
  if (Array.isArray(seg.content)) {
    return seg.content.reduce(
      (sum: number, inner) => sum + (typeof inner?.content === 'string' ? countWords(inner.content) : 0),
      0,
    );
  }
  return 0;
}

function blockWordCount(block: TermsBodyBlock): number {
  switch (block.type) {
    case 'paragraph':
    case 'callout':
    case 'expandable':
      return block.content.reduce((sum, seg) => sum + segmentWordCount(seg), 0);
    case 'list':
      return countWords(block.items.join(' '));
    case 'heading':
    case 'subheading':
      return countWords(block.text);
    case 'quote':
      return countWords(block.text);
    case 'accordion':
      return block.content.reduce(
        (sum, qa) => sum + countWords(qa.question) + qa.answer.reduce((s, a) => s + countWords(a.text), 0),
        0,
      );
    default:
      return 0;
  }
}

function wordCount(term: Term): number {
  return term.content.reduce((sum, block) => sum + blockWordCount(block), 0);
}

/** Real content depth (word count) is the only honest signal available on a static
 * glossary entry, so difficulty and popularity are both derived from it rather than
 * invented outright. */
function difficultyFor(words: number): TopicDifficulty {
  if (words < 350) return 'Beginner';
  if (words < 700) return 'Intermediate';
  return 'Advanced';
}

function readingTimeFor(words: number): string {
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/** 0-100 content-richness proxy (word count, capped) — not a real popularity metric,
 * just a stable, content-derived score so the UI has something other than a random
 * number to sort/display. */
function popularityFor(words: number): number {
  return Math.min(99, Math.round((words / 1200) * 100));
}

function toTopicNode(term: Term): TopicNode {
  const words = wordCount(term);
  return {
    id: term.slug,
    title: term.seoTitle || term.title,
    slug: term.slug,
    definition: term.seoDescription || term.title,
    category: term.categoryNames || 'General',
    difficulty: difficultyFor(words),
    reading_time: readingTimeFor(words),
    popularity_score: popularityFor(words),
    type: 'Article',
  };
}

function buildLearningPaths(terms: Term[]): LearningPath[] {
  const bySlug = (slugs: string[]) =>
    slugs
      .map((slug) => terms.find((t) => t.slug === slug))
      .filter((t): t is Term => Boolean(t))
      .map((t) => ({ title: t.seoTitle || t.title, slug: t.slug }));

  const paths: LearningPath[] = [];

  const stocksTopics = bySlug(['bull-market', 'bear-market', 'dividend', 'ipo', 'etf', 'mutual-fund']);
  if (stocksTopics.length > 0) {
    paths.push({
      id: 'path-stocks-fundamentals',
      name: 'Stock Market Fundamentals',
      description:
        'Core concepts for understanding how equity markets move, how companies return cash to shareholders, and how the primary investment vehicles work.',
      topics: stocksTopics,
    });
  }

  const macroTopics = bySlug(['gross-domestic-product', 'treasury-bond', 'hedge-fund', 'index-fund', 'net-worth', 'estate-tax']);
  if (macroTopics.length > 0) {
    paths.push({
      id: 'path-macro-personal-finance',
      name: 'Macro & Personal Finance Essentials',
      description:
        'A grounding in the economic indicators and personal-finance building blocks that shape both markets and household financial decisions.',
      topics: macroTopics,
    });
  }

  return paths;
}

export async function getGlobalTopicIndexData(): Promise<GlobalTopicIndexData> {
  const terms = await fetchAllTerms();

  const topics = terms.map(toTopicNode);

  const categoryCounts = new Map<string, number>();
  terms.forEach((t) => {
    const cat = t.categoryNames || 'General';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const trending_topics = [...topics]
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, 6)
    .map((t) => t.title);

  const learning_paths = buildLearningPaths(terms);

  return { topics, trending_topics, learning_paths, categories };
}

/** Resolve a topic's real `/terms/{letter}/{slug}` URL (re-exported for convenience). */
export { getTermUrl };
