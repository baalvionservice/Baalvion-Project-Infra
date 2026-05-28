import { Client } from '@opensearch-project/opensearch';

// ─── OpenSearch Client ────────────────────────────────────────────────────────

/**
 * Singleton OpenSearch client configured via environment variables.
 *
 * Required env vars:
 *   OPENSEARCH_URL   — node URL (default: http://localhost:9200)
 *   OPENSEARCH_USER  — basic auth username (optional)
 *   OPENSEARCH_PASS  — basic auth password (optional, paired with USER)
 */
export const searchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: process.env.OPENSEARCH_USER
    ? {
        username: process.env.OPENSEARCH_USER,
        password: process.env.OPENSEARCH_PASS || '',
      }
    : undefined,
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});
