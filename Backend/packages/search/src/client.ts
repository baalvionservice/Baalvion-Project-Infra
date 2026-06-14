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
    // SECURE BY DEFAULT: verify the server cert in ALL environments (the old
    // `NODE_ENV === 'production'` gate silently disabled verification in
    // staging/preprod/unset env → MITM). Opt out only via an explicit env, and
    // pin a CA via OPENSEARCH_CA when the cluster uses a private/self-signed CA.
    rejectUnauthorized: process.env.OPENSEARCH_TLS_REJECT_UNAUTHORIZED !== 'false',
    ...(process.env.OPENSEARCH_CA ? { ca: process.env.OPENSEARCH_CA } : {}),
  },
});
