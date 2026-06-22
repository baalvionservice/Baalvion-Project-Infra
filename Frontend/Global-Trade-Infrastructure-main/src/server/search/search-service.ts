/**
 * @file server/search/search-service.ts
 * @description PROMPT 8 — the marketplace search application service. A thin,
 * tenant-aware orchestration layer over the active backend: full-text + faceted
 * search, type-ahead suggestions, a (re)index pass that streams the catalogue into
 * the external index, and an incremental per-record sync hook. Identity/tenant are
 * always supplied by the caller from the verified principal — never trusted input.
 */
import { searchRepository } from '../repositories/search-repository';
import { getSearchBackend } from './backend';
import { projectRecord } from './document';
import { SearchQuery, SearchResult, SearchSuggestion, CATALOG_ENTITY_TYPES } from './types';

const CATALOG_TYPES: readonly string[] = CATALOG_ENTITY_TYPES;

export interface ReindexResult {
  backend: string;
  indexed: number;
  note?: string;
}

export const searchService = {
  search(organizationId: string | null, query: SearchQuery): Promise<SearchResult> {
    return getSearchBackend().search(organizationId, query);
  },

  suggest(organizationId: string | null, prefix: string, limit = 10): Promise<SearchSuggestion[]> {
    return getSearchBackend().suggest(organizationId, prefix, limit);
  },

  /**
   * (Re)build the external index for the catalogue visible to `organizationId`
   * (its tenant records ⊕ the global baseline). A no-op for the live-reading
   * parity backend, which has no external index to populate.
   */
  async reindex(organizationId: string | null, opts: { batchSize?: number } = {}): Promise<ReindexResult> {
    const backend = getSearchBackend();
    if (backend.name !== 'opensearch') {
      return { backend: backend.name, indexed: 0, note: 'parity backend reads live; no external index to build' };
    }
    const batchSize = Math.min(2000, Math.max(1, opts.batchSize ?? 500));
    let cursor: string | undefined;
    let indexed = 0;
    for (;;) {
      const rows = await searchRepository.page(organizationId, [...CATALOG_ENTITY_TYPES], batchSize, cursor);
      if (rows.length === 0) break;
      indexed += await backend.index(rows.map(projectRecord));
      cursor = rows[rows.length - 1].id;
      if (rows.length < batchSize) break;
    }
    return { backend: backend.name, indexed };
  },

  /**
   * Keep the external index consistent with one catalogue record after a write.
   * Removes it when missing / soft-deleted / out of catalogue scope; upserts it
   * otherwise. A no-op for the parity backend.
   */
  async syncRecord(recordId: string): Promise<void> {
    const backend = getSearchBackend();
    if (backend.name !== 'opensearch') return;
    const record = await searchRepository.findById(recordId);
    if (!record || record.deletedAt || !CATALOG_TYPES.includes(record.entityType)) {
      await backend.remove([recordId]);
      return;
    }
    await backend.index([projectRecord(record)]);
  },
};
