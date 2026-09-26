import { FileText, User, Clapperboard, Music, Shield, Trophy, Gavel, Landmark, Tag, type LucideIcon } from 'lucide-react';
import type { SearchResultType } from '@/lib/global-search';

/** One label + icon per search result type — shared by the search dropdown and the /search results page so a result always identifies its entity type the same way. */
export const SEARCH_TYPE_META: Record<SearchResultType, { label: string; icon: LucideIcon }> = {
  article: { label: 'Article', icon: FileText },
  person: { label: 'Person', icon: User },
  movie: { label: 'Movie', icon: Clapperboard },
  'tv-show': { label: 'TV Show', icon: Clapperboard },
  'streaming-show': { label: 'Streaming', icon: Clapperboard },
  'music-release': { label: 'Music', icon: Music },
  album: { label: 'Album', icon: Music },
  song: { label: 'Song', icon: Music },
  award: { label: 'Award', icon: Trophy },
  event: { label: 'Event', icon: Clapperboard },
  'sports-team': { label: 'Team', icon: Shield },
  'sports-competition': { label: 'Competition', icon: Trophy },
  'legal-case': { label: 'Legal Case', icon: Gavel },
  court: { label: 'Court', icon: Landmark },
  topic: { label: 'Topic', icon: Tag },
};
