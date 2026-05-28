// ─── @baalvion/search — enterprise search package ────────────────────────────

// OpenSearch client singleton
export { searchClient } from './client';

// Index name constants and document interfaces
export { INDICES, INDEX_MAPPINGS } from './indices';
export type {
  IndexName,
  JobDocument,
  ArticleDocument,
  ProductDocument,
  CompanyDocument,
  CreatorDocument,
} from './indices';

// Document indexing operations
export {
  indexDocument,
  updateDocument,
  deleteDocument,
  bulkIndex,
} from './indexer';
export type { BulkIndexItem, BulkIndexResult } from './indexer';

// Search query builder
export { search, autocomplete, facetedSearch } from './query';
export type {
  SearchOptions,
  SearchHit,
  SearchResult,
  FacetBucket,
  FacetedSearchResult,
} from './query';

// Index sync / management
export { createIndex, deleteIndex, reindexAll } from './sync';
