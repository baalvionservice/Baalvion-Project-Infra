import { searchClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BulkIndexItem<T extends object = Record<string, unknown>> {
  id: string;
  doc: T;
}

export interface BulkIndexResult {
  indexed: number;
  failed: number;
  errors: Array<{ id: string; reason: string }>;
}

// ─── Single Document Operations ───────────────────────────────────────────────

/**
 * Index (create or replace) a single document.
 */
export async function indexDocument<T extends object>(
  index: string,
  id: string,
  doc: T,
): Promise<void> {
  await searchClient.index({
    index,
    id,
    body: doc,
    refresh: 'wait_for',
  });
}

/**
 * Apply a partial update to an existing document.
 * Only the provided fields are updated; others remain unchanged.
 */
export async function updateDocument<T extends object>(
  index: string,
  id: string,
  partial: Partial<T>,
): Promise<void> {
  await searchClient.update({
    index,
    id,
    body: { doc: partial },
    refresh: 'wait_for',
  });
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(index: string, id: string): Promise<void> {
  await searchClient.delete({
    index,
    id,
    refresh: 'wait_for',
  });
}

// ─── Bulk Operations ──────────────────────────────────────────────────────────

/**
 * Bulk-index multiple documents into an index.
 * Handles partial failures — returns a result summary rather than throwing.
 */
export async function bulkIndex<T extends object>(
  index: string,
  docs: BulkIndexItem<T>[],
): Promise<BulkIndexResult> {
  if (docs.length === 0) {
    return { indexed: 0, failed: 0, errors: [] };
  }

  const body = docs.flatMap(({ id, doc }) => [
    { index: { _index: index, _id: id } },
    doc,
  ]);

  const response = await searchClient.bulk({ body, refresh: 'wait_for' });

  const result: BulkIndexResult = { indexed: 0, failed: 0, errors: [] };

  if (response.body.errors) {
    for (const item of response.body.items as Array<{ index?: { _id?: string; error?: { reason?: string }; result?: string } }>) {
      const op = item.index;
      if (!op) continue;
      if (op.error) {
        result.failed++;
        result.errors.push({
          id: op._id ?? 'unknown',
          reason: op.error.reason ?? 'Unknown error',
        });
      } else {
        result.indexed++;
      }
    }
  } else {
    result.indexed = docs.length;
  }

  return result;
}
