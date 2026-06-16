/**
 * PostgreSQL implementation of `OutboxStore`.
 *
 * Driver-agnostic: it talks to a minimal `PgQueryRunner` (`query(sql, params) => { rows }`),
 * which node-postgres' `Pool`/`Client` satisfy directly, and a Sequelize/Knex connection
 * satisfies with a one-line adapter. `enqueue` accepts an alternate runner so the row is written
 * inside the caller's open transaction (commits atomically with the domain mutation).
 *
 * The claim is a single statement — a `FOR UPDATE SKIP LOCKED` CTE that selects due rows and
 * leases them (`available_at = leaseUntil`) in the same round-trip — so locks are never held
 * across broker I/O and concurrent relays/ticks never double-claim.
 *
 * Payload is stored as `text` (not `jsonb`) on purpose: the relay does `JSON.parse(row.payload)`,
 * and a `text` column round-trips a string unambiguously across drivers (jsonb would come back as
 * an already-parsed object under node-postgres).
 */
import type { PlatformEvent } from '@baalvion/types';
import type { OutboxStore, OutboxRow } from './outbox';

export interface PgQueryResult { rows: any[]; }
export interface PgQueryRunner {
  query(text: string, params?: unknown[]): Promise<PgQueryResult>;
}

export interface PgOutboxStoreOptions {
  /** Default runner (a pool/client) used for claim/markSent/recordFailure and for enqueue when no tx is passed. */
  runner: PgQueryRunner;
  /** Schema the outbox table lives in. Default 'public'. */
  schema?: string;
  /** Table name. Default 'event_outbox'. */
  table?: string;
}

const MAX_ERR_LEN = 2000;

function quoteIdent(ident: string): string {
  // Whitelist: identifiers are developer-supplied config, never user input — but guard anyway.
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
    throw new Error(`[outbox] invalid SQL identifier: ${ident}`);
  }
  return `"${ident}"`;
}

function truncate(s: string): string {
  return s.length <= MAX_ERR_LEN ? s : s.slice(0, MAX_ERR_LEN);
}

function toRow(r: Record<string, unknown>): OutboxRow {
  const payload = r.payload;
  return {
    id: String(r.id),
    type: String(r.type),
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
    attempts: Number(r.attempts ?? 0),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  };
}

export function createPgOutboxStore(opts: PgOutboxStoreOptions): OutboxStore {
  const schema = quoteIdent(opts.schema ?? 'public');
  const tableName = opts.table ?? 'event_outbox';
  const table = `${schema}.${quoteIdent(tableName)}`;
  const base = opts.runner;

  return {
    async enqueue(event: PlatformEvent, tx?: unknown): Promise<void> {
      const runner = (tx as PgQueryRunner | undefined)?.query ? (tx as PgQueryRunner) : base;
      await runner.query(
        `INSERT INTO ${table} (id, type, payload, org_id, status, attempts, available_at, created_at)
         VALUES ($1, $2, $3, $4, 'pending', 0, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        [event.id, event.type, JSON.stringify(event), event.orgId ?? null],
      );
    },

    async claimBatch(limit: number, now: Date, leaseUntil: Date): Promise<OutboxRow[]> {
      const { rows } = await base.query(
        `WITH due AS (
           SELECT id FROM ${table}
            WHERE status = 'pending' AND available_at <= $2
            ORDER BY available_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
         )
         UPDATE ${table} o
            SET available_at = $3
           FROM due
          WHERE o.id = due.id
          RETURNING o.id, o.type, o.payload, o.attempts, o.created_at`,
        [limit, now.toISOString(), leaseUntil.toISOString()],
      );
      return rows.map(toRow);
    },

    async markSent(ids: string[]): Promise<void> {
      if (!ids.length) return;
      await base.query(
        `UPDATE ${table} SET status = 'sent', sent_at = now() WHERE id = ANY($1::uuid[])`,
        [ids],
      );
    },

    async recordFailure(id: string, error: string, nextAvailableAt: Date, dead: boolean): Promise<void> {
      await base.query(
        `UPDATE ${table}
            SET attempts = attempts + 1,
                last_error = $2,
                status = CASE WHEN $4 THEN 'failed' ELSE status END,
                available_at = $3
          WHERE id = $1`,
        [id, truncate(error), nextAvailableAt.toISOString(), dead],
      );
    },
  };
}

/**
 * DDL for the outbox table, ready to drop into a migration. `text` payload + a `(status,
 * available_at)` claim index, matching what `createPgOutboxStore` expects. No RLS: the relay
 * reads cross-tenant, so the table is relay-internal and isolated by owner-only grants + the
 * tenant-scoped `org_id` column (same decision as the Java finance suite's relay tables).
 */
export function outboxTableDDL(schema = 'public', table = 'event_outbox'): string {
  const s = quoteIdent(schema);
  const t = `${s}.${quoteIdent(table)}`;
  return [
    `CREATE TABLE IF NOT EXISTS ${t} (`,
    `  id           uuid PRIMARY KEY,`,
    `  type         varchar(160) NOT NULL,`,
    `  payload      text NOT NULL,`,
    `  org_id       uuid,`,
    `  status       varchar(16) NOT NULL DEFAULT 'pending',`,
    `  attempts     int NOT NULL DEFAULT 0,`,
    `  last_error   text,`,
    `  available_at timestamptz NOT NULL DEFAULT now(),`,
    `  created_at   timestamptz NOT NULL DEFAULT now(),`,
    `  sent_at      timestamptz,`,
    `  CONSTRAINT ${table}_status_chk CHECK (status IN ('pending','sent','failed'))`,
    `);`,
    `CREATE INDEX IF NOT EXISTS ${table}_claim_idx ON ${t} (status, available_at);`,
  ].join('\n');
}
