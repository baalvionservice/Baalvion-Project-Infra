import { searchClient } from './client';
import { INDEX_MAPPINGS } from './indices';
import type { IndexName } from './indices';
import { bulkIndex } from './indexer';
import type { BulkIndexItem } from './indexer';

// ─── Index Management ─────────────────────────────────────────────────────────

/**
 * Create an index with predefined mappings if it does not already exist.
 * Safe to call on every startup (idempotent).
 */
export async function createIndex(
  index: IndexName,
  mapping?: object,
): Promise<void> {
  const exists = await searchClient.indices.exists({ index });
  if (exists.body) return; // already exists — nothing to do

  const resolvedMapping = mapping ?? INDEX_MAPPINGS[index];

  await searchClient.indices.create({
    index,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: process.env.NODE_ENV === 'production' ? 1 : 0,
      },
      mappings: resolvedMapping,
    },
  });
}

/**
 * Delete an index entirely. Irreversible — use with care.
 */
export async function deleteIndex(index: string): Promise<void> {
  const exists = await searchClient.indices.exists({ index });
  if (!exists.body) return; // already gone

  await searchClient.indices.delete({ index });
}

// ─── Full Reindex ─────────────────────────────────────────────────────────────

const BATCH_SIZE = 500;
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 250;

/**
 * Full reindex operation with exponential backoff on failures.
 *
 * @param index     Target OpenSearch index name.
 * @param fetchAll  Async function that returns all documents to index.
 *                  Each document must have an `id` field used as the document ID.
 */
export async function reindexAll<T extends object & { id: string }>(
  index: string,
  fetchAll: () => Promise<T[]>,
): Promise<{ total: number; failed: number }> {
  const allDocs = await fetchAll();
  let totalIndexed = 0;
  let totalFailed = 0;

  // Process in batches to avoid oversized request bodies
  for (let offset = 0; offset < allDocs.length; offset += BATCH_SIZE) {
    const batch = allDocs.slice(offset, offset + BATCH_SIZE);
    const items: BulkIndexItem<T>[] = batch.map((doc) => ({
      id: doc.id,
      doc,
    }));

    const result = await bulkIndexWithRetry(index, items);
    totalIndexed += result.indexed;
    totalFailed  += result.failed;
  }

  return { total: totalIndexed, failed: totalFailed };
}

// ─── Internal: Bulk with Exponential Backoff ──────────────────────────────────

async function bulkIndexWithRetry<T extends object>(
  index: string,
  items: BulkIndexItem<T>[],
  attempt = 0,
): Promise<{ indexed: number; failed: number }> {
  try {
    const result = await bulkIndex(index, items);

    // If there are failed items, retry only those with backoff
    if (result.failed > 0 && attempt < MAX_RETRIES) {
      const failedIds = new Set(result.errors.map((e) => e.id));
      const retryItems = items.filter((item) => failedIds.has(item.id));
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);

      const retryResult = await bulkIndexWithRetry(index, retryItems, attempt + 1);
      return {
        indexed: result.indexed + retryResult.indexed,
        failed: retryResult.failed, // final failure count after retries
      };
    }

    return { indexed: result.indexed, failed: result.failed };
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      console.error(`[search/sync] bulkIndex failed after ${MAX_RETRIES} retries:`, err);
      return { indexed: 0, failed: items.length };
    }
    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
    await sleep(delay);
    return bulkIndexWithRetry(index, items, attempt + 1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
