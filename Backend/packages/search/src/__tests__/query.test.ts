/**
 * Tests for query.ts — search, autocomplete, and facetedSearch builders.
 * The OpenSearch client is mocked to avoid requiring a running cluster.
 */

// Mock the client module before importing query functions
jest.mock('../client', () => ({
  searchClient: {
    search: jest.fn(),
  },
}));

import { search, autocomplete, facetedSearch } from '../query';
import { searchClient } from '../client';

// Loosely typed: the OpenSearch client's overloaded return type makes the strict
// MockedFunction signature resolve mock args to `never` / possibly-undefined under
// noUncheckedIndexedAccess. A jest.Mock keeps the assertions readable in this test.
const mockSearch = searchClient.search as unknown as jest.Mock;

function makeResponse(overrides: Record<string, unknown> = {}) {
  return {
    body: {
      hits: {
        total: { value: 0, relation: 'eq' },
        hits: [],
      },
      took: 1,
      ...overrides,
    },
  } as ReturnType<typeof searchClient.search> extends Promise<infer R> ? R : never;
}

beforeEach(() => {
  mockSearch.mockResolvedValue(makeResponse() as any);
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── search() ─────────────────────────────────────────────────────────────────

describe('search()', () => {
  it('calls searchClient.search with the correct index', async () => {
    await search({ query: 'engineer', index: 'baalvion_jobs' });
    expect(mockSearch).toHaveBeenCalledTimes(1);
    const [callArgs] = mockSearch.mock.calls;
    expect(callArgs[0].index).toBe('baalvion_jobs');
  });

  it('builds a multi_match query with the given query string', async () => {
    await search({ query: 'frontend developer', index: 'baalvion_jobs' });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.query.bool.must.multi_match.query).toBe('frontend developer');
  });

  it('uses fuzziness AUTO when fuzzy=true', async () => {
    await search({ query: 'enginer', index: 'baalvion_jobs', fuzzy: true });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.query.bool.must.multi_match.fuzziness).toBe('AUTO');
  });

  it('does not include fuzziness when fuzzy=false (default)', async () => {
    await search({ query: 'engineer', index: 'baalvion_jobs' });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.query.bool.must.multi_match.fuzziness).toBeUndefined();
  });

  it('applies filter clauses when filters are provided', async () => {
    await search({ query: 'dev', index: 'baalvion_jobs', filters: { isActive: true } });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.query.bool.filter).toBeDefined();
    expect(body.query.bool.filter).toEqual([{ term: { isActive: true } }]);
  });

  it('does not include filter key when no filters given', async () => {
    await search({ query: 'dev', index: 'baalvion_jobs' });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.query.bool.filter).toBeUndefined();
  });

  it('defaults from=0 and size=20', async () => {
    await search({ query: 'dev', index: 'baalvion_jobs' });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.from).toBe(0);
    expect(body.size).toBe(20);
  });

  it('respects custom from and size', async () => {
    await search({ query: 'dev', index: 'baalvion_jobs', from: 20, size: 10 });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.from).toBe(20);
    expect(body.size).toBe(10);
  });

  it('builds sort config when sort is provided', async () => {
    await search({ query: 'dev', index: 'baalvion_jobs', sort: [{ field: 'postedAt', order: 'desc' }] });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.sort).toEqual([{ postedAt: { order: 'desc' } }]);
  });

  it('builds highlight config with mark tags when highlight is provided', async () => {
    await search({ query: 'dev', index: 'baalvion_jobs', highlight: ['title', 'description'] });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.highlight.pre_tags).toEqual(['<mark>']);
    expect(body.highlight.post_tags).toEqual(['</mark>']);
    expect(body.highlight.fields.title).toBeDefined();
    expect(body.highlight.fields.description).toBeDefined();
  });

  it('returns hits, total, and took from the response', async () => {
    mockSearch.mockResolvedValueOnce(makeResponse({
      hits: {
        total: { value: 1, relation: 'eq' },
        hits: [{ _id: 'doc1', _score: 1.5, _source: { title: 'Dev' } }],
      },
      took: 5,
    }) as any);

    const result = await search<{ title: string }>({ query: 'dev', index: 'baalvion_jobs' });
    expect(result.total).toBe(1);
    expect(result.took).toBe(5);
    expect(result.hits).toHaveLength(1);
    // Length asserted above, so [0] is present; `!` satisfies noUncheckedIndexedAccess.
    expect(result.hits[0]!.id).toBe('doc1');
    expect(result.hits[0]!.score).toBe(1.5);
    expect(result.hits[0]!.source.title).toBe('Dev');
  });

  it('handles numeric total (older ES format)', async () => {
    mockSearch.mockResolvedValueOnce(makeResponse({
      hits: { total: 42, hits: [] },
    }) as any);
    const result = await search({ query: 'x', index: 'baalvion_jobs' });
    expect(result.total).toBe(42);
  });
});

// ─── autocomplete() ───────────────────────────────────────────────────────────

describe('autocomplete()', () => {
  it('calls searchClient.search with correct index', async () => {
    await autocomplete('baalvion_jobs', 'title', 'front');
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect((mockSearch.mock.calls[0][0] as any).index).toBe('baalvion_jobs');
  });

  it('builds a prefix query on the given field', async () => {
    await autocomplete('baalvion_jobs', 'title', 'Front');
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.query.prefix.title).toBeDefined();
  });

  it('lowercases the prefix value', async () => {
    await autocomplete('baalvion_jobs', 'title', 'Frontend');
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.query.prefix.title.value).toBe('frontend');
  });

  it('defaults size to 10', async () => {
    await autocomplete('baalvion_jobs', 'title', 'dev');
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.size).toBe(10);
  });

  it('respects custom size', async () => {
    await autocomplete('baalvion_jobs', 'title', 'dev', 5);
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.size).toBe(5);
  });
});

// ─── facetedSearch() ──────────────────────────────────────────────────────────

describe('facetedSearch()', () => {
  it('calls searchClient.search with the correct index', async () => {
    await facetedSearch('baalvion_jobs', 'engineer', ['skills', 'location']);
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect((mockSearch.mock.calls[0][0] as any).index).toBe('baalvion_jobs');
  });

  it('builds terms aggregations for each facet field', async () => {
    await facetedSearch('baalvion_jobs', 'engineer', ['skills', 'location']);
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.aggs.skills).toEqual({ terms: { field: 'skills', size: 50 } });
    expect(body.aggs.location).toEqual({ terms: { field: 'location', size: 50 } });
  });

  it('includes filter clauses when filters provided', async () => {
    await facetedSearch('baalvion_jobs', 'dev', ['skills'], { filters: { isActive: true } });
    const body = (mockSearch.mock.calls[0][0] as any).body;
    expect(body.query.bool.filter).toEqual([{ term: { isActive: true } }]);
  });

  it('returns facets from aggregation buckets', async () => {
    mockSearch.mockResolvedValueOnce(makeResponse({
      hits: { total: { value: 5, relation: 'eq' }, hits: [] },
      aggregations: {
        skills: {
          buckets: [
            { key: 'React', doc_count: 3 },
            { key: 'TypeScript', doc_count: 2 },
          ],
        },
      },
    }) as any);

    const result = await facetedSearch('baalvion_jobs', 'dev', ['skills']);
    expect(result.facets.skills).toEqual([
      { key: 'React', count: 3 },
      { key: 'TypeScript', count: 2 },
    ]);
  });

  it('returns empty facet array when aggregation is missing', async () => {
    const result = await facetedSearch('baalvion_jobs', 'dev', ['missingField']);
    expect(result.facets.missingField).toEqual([]);
  });
});
