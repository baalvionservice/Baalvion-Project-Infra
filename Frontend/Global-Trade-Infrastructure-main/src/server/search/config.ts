/**
 * @file server/search/config.ts
 * @description PROMPT 8 — search backend selection + OpenSearch connection config,
 * read from the environment (the same convention the rest of the server uses).
 *
 * Resolution: `SEARCH_BACKEND` wins when set to `opensearch` | `postgres`;
 * otherwise OpenSearch is used when `OPENSEARCH_NODE` is configured, and the
 * in-process Postgres/GCKB parity backend is used everywhere else (dev, CI and the
 * embedded-Postgres test run) so the engine needs zero new infrastructure to run.
 */
import { SearchBackendName } from './types';

export function searchBackendChoice(): SearchBackendName {
  const explicit = (process.env.SEARCH_BACKEND ?? '').trim().toLowerCase();
  if (explicit === 'opensearch') return 'opensearch';
  if (explicit === 'postgres') return 'postgres';
  return process.env.OPENSEARCH_NODE ? 'opensearch' : 'postgres';
}

export interface OpenSearchConfig {
  node: string;
  index: string;
  username?: string;
  password?: string;
  /** Skip TLS verification — for self-signed dev clusters ONLY. */
  insecureTls: boolean;
}

export function openSearchConfig(): OpenSearchConfig {
  return {
    node: process.env.OPENSEARCH_NODE ?? 'http://localhost:9200',
    index: process.env.OPENSEARCH_INDEX ?? 'baalvion_catalog',
    username: process.env.OPENSEARCH_USERNAME || undefined,
    password: process.env.OPENSEARCH_PASSWORD || undefined,
    insecureTls: process.env.OPENSEARCH_INSECURE_TLS === '1',
  };
}
