/**
 * @file server/search/opensearch-backend.ts
 * @description PROMPT 8 — the production OpenSearch backend. The client is loaded
 * lazily through a non-literal specifier so the package is an OPTIONAL dependency:
 * the build, type-check and the parity test run never require it, and selecting
 * this backend without it installed fails loudly with an actionable message. All
 * query/response shaping lives in the pure `opensearch-dsl` module (unit-tested
 * without a live cluster); this adapter only does I/O.
 */
import {
  SearchBackend,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
  SearchDocument,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './types';
import { OpenSearchConfig } from './config';
import { buildSearchBody, buildSuggestBody, parseSearchResponse, toIndexDoc } from './opensearch-dsl';

/** The slice of the OpenSearch client surface this adapter actually uses. */
interface OsClient {
  search(params: { index: string; body: unknown }): Promise<{ body: unknown }>;
  bulk(params: { body: unknown[]; refresh?: boolean }): Promise<{ body: { errors?: boolean } }>;
  indices: {
    exists(params: { index: string }): Promise<{ body: boolean }>;
    create(params: { index: string; body: unknown }): Promise<unknown>;
  };
}

interface OsModule {
  Client: new (opts: Record<string, unknown>) => OsClient;
}

const INDEX_MAPPING = {
  mappings: {
    properties: {
      id: { type: 'keyword' },
      tenant: { type: 'keyword' },
      entityType: { type: 'keyword' },
      domain: { type: 'keyword' },
      recordKey: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      description: { type: 'text' },
      category: { type: 'keyword' },
      country: { type: 'keyword' },
      price: { type: 'scaled_float', scaling_factor: 100 },
      currency: { type: 'keyword' },
      brand: { type: 'keyword' },
      hsCode: { type: 'keyword' },
      tags: { type: 'keyword' },
      status: { type: 'keyword' },
      imageUrl: { type: 'keyword', index: false },
      updatedAt: { type: 'date' },
      searchText: { type: 'text' },
    },
  },
};

export class OpenSearchBackend implements SearchBackend {
  readonly name = 'opensearch' as const;
  private clientPromise: Promise<OsClient> | null = null;

  constructor(private readonly cfg: OpenSearchConfig) {}

  private async client(): Promise<OsClient> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        // Non-literal specifier keeps this an OPTIONAL dependency at build/type time.
        const specifier = '@opensearch-project/opensearch';
        let mod: OsModule;
        try {
          mod = (await import(/* @vite-ignore */ specifier)) as unknown as OsModule;
        } catch {
          throw new Error(
            "SEARCH_BACKEND=opensearch but '@opensearch-project/opensearch' is not installed. " +
              'Run `pnpm add @opensearch-project/opensearch` and set OPENSEARCH_NODE, or use the default Postgres backend.',
          );
        }
        const auth = this.cfg.username
          ? { auth: { username: this.cfg.username, password: this.cfg.password ?? '' } }
          : {};
        const ssl = this.cfg.insecureTls ? { ssl: { rejectUnauthorized: false } } : {};
        return new mod.Client({ node: this.cfg.node, ...auth, ...ssl });
      })();
    }
    return this.clientPromise;
  }

  async search(organizationId: string | null, query: SearchQuery): Promise<SearchResult> {
    const client = await this.client();
    const resp = await client.search({ index: this.cfg.index, body: buildSearchBody(organizationId, query) });
    const parsed = parseSearchResponse(resp.body, query);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
    return { ...parsed, page, pageSize, backend: this.name, capped: false };
  }

  async suggest(organizationId: string | null, prefix: string, limit: number): Promise<SearchSuggestion[]> {
    const trimmed = prefix.trim();
    if (!trimmed) return [];
    const client = await this.client();
    const resp = await client.search({ index: this.cfg.index, body: buildSuggestBody(trimmed, limit) });
    const hits = ((resp.body as { hits?: { hits?: Array<{ _source?: Partial<SearchDocument> }> } }).hits?.hits) ?? [];
    return hits.map((h) => ({
      id: h._source?.id ?? '',
      entityType: h._source?.entityType ?? '',
      title: h._source?.title ?? '',
      recordKey: h._source?.recordKey ?? '',
    }));
  }

  async ensureIndex(): Promise<void> {
    const client = await this.client();
    const exists = await client.indices.exists({ index: this.cfg.index });
    if (!exists.body) await client.indices.create({ index: this.cfg.index, body: INDEX_MAPPING });
  }

  async index(docs: SearchDocument[]): Promise<number> {
    if (docs.length === 0) return 0;
    await this.ensureIndex();
    const client = await this.client();
    const body: unknown[] = [];
    for (const doc of docs) {
      body.push({ index: { _index: this.cfg.index, _id: doc.id } });
      body.push(toIndexDoc(doc));
    }
    const res = await client.bulk({ body, refresh: true });
    if (res.body?.errors) throw new Error('OpenSearch bulk index reported item-level errors');
    return docs.length;
  }

  async remove(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const client = await this.client();
    const body: unknown[] = ids.map((id) => ({ delete: { _index: this.cfg.index, _id: id } }));
    await client.bulk({ body, refresh: true });
    return ids.length;
  }
}
