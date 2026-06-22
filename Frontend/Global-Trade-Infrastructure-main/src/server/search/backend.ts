/**
 * @file server/search/backend.ts
 * @description PROMPT 8 — resolves the active `SearchBackend` from configuration
 * and memoises it per choice. `resetSearchBackend()` lets tests flip the backend
 * between runs without leaking a stale client.
 */
import { SearchBackend, SearchBackendName } from './types';
import { searchBackendChoice, openSearchConfig } from './config';
import { PostgresSearchBackend } from './postgres-backend';
import { OpenSearchBackend } from './opensearch-backend';

let cache: { choice: SearchBackendName; backend: SearchBackend } | null = null;

export function getSearchBackend(): SearchBackend {
  const choice = searchBackendChoice();
  if (cache && cache.choice === choice) return cache.backend;
  const backend: SearchBackend =
    choice === 'opensearch' ? new OpenSearchBackend(openSearchConfig()) : new PostgresSearchBackend();
  cache = { choice, backend };
  return backend;
}

export function resetSearchBackend(): void {
  cache = null;
}
