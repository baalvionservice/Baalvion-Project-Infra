/**
 * @file server/search/postgres-backend.ts
 * @description PROMPT 8 — the Postgres/GCKB parity backend. It owns no separate
 * index: it pulls a bounded, keyword-relevant candidate window from `gckb_records`
 * and runs the pure engine over it for ranking + Country/Category/Price facets.
 * `index`/`remove` are intentional no-ops (reads are always live), so it needs no
 * sync pipeline and stays correct under the embedded-Postgres test harness.
 */
import { searchRepository } from '../repositories/search-repository';
import { projectRecord } from './document';
import { searchDocuments, suggestDocuments } from './engine';
import {
  SearchBackend,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
  CATALOG_ENTITY_TYPES,
  CANDIDATE_CAP,
} from './types';

function entityScope(query: SearchQuery): string[] {
  return query.entityTypes && query.entityTypes.length ? query.entityTypes : [...CATALOG_ENTITY_TYPES];
}

export class PostgresSearchBackend implements SearchBackend {
  readonly name = 'postgres' as const;

  async search(organizationId: string | null, query: SearchQuery): Promise<SearchResult> {
    const filter = { entityTypes: entityScope(query), keyword: query.keyword, status: query.status };
    const [records, total] = await Promise.all([
      searchRepository.candidates(organizationId, filter, CANDIDATE_CAP),
      searchRepository.count(organizationId, filter),
    ]);
    const docs = records.map(projectRecord);
    const core = searchDocuments(docs, query);
    return { ...core, backend: this.name, capped: total > CANDIDATE_CAP };
  }

  async suggest(organizationId: string | null, prefix: string, limit: number): Promise<SearchSuggestion[]> {
    const trimmed = prefix.trim();
    if (!trimmed) return [];
    const rows = await searchRepository.suggestions(
      organizationId,
      [...CATALOG_ENTITY_TYPES],
      trimmed,
      Math.min(25, Math.max(1, limit)),
    );
    return suggestDocuments(rows.map(projectRecord), trimmed, limit);
  }

  async index(): Promise<number> {
    return 0; // live-reading backend: nothing to push
  }

  async remove(): Promise<number> {
    return 0;
  }
}
