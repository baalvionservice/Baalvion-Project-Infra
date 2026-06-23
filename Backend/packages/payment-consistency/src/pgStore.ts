/**
 * PostgreSQL implementation of the PCL ports.
 *
 * Driver-agnostic: it talks to a minimal `PgQueryRunner` (`query(sql, params) => { rows, rowCount }`)
 * that node-postgres' `Pool`/`Client` satisfy directly and a Sequelize/Knex connection satisfies
 * with a one-line adapter. The transaction runner checks out a client, BEGINs, and COMMIT/ROLLBACKs.
 *
 * The outbox table layout deliberately matches `@baalvion/events` `outboxTableDDL`, so the existing
 * `createPgOutboxStore` + `startOutboxRelay` relay can publish PCL side-effects with ZERO new
 * delivery code (see README "Outbox & relay"). We write the row ourselves (so it commits in the
 * state-change transaction); the shared relay only reads/publishes/marks it.
 */
import type { PaymentEvent } from './events';
import type { PaymentState } from './states';
import {
  type InboxStore,
  type OutboxEnvelope,
  type OutboxWriter,
  type PaymentRecord,
  type PaymentStateStore,
  type Tx,
  type TxRunner,
} from './ports';

export interface PgQueryResult {
  rows: any[];
  rowCount?: number | null;
}
export interface PgQueryRunner {
  query(text: string, params?: unknown[]): Promise<PgQueryResult>;
}
export interface PgClient extends PgQueryRunner {
  release(): void;
}
export interface PgPool extends PgQueryRunner {
  connect(): Promise<PgClient>;
}

function quoteIdent(ident: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
    throw new Error(`[pcl] invalid SQL identifier: ${ident}`);
  }
  return `"${ident}"`;
}

function runnerOf(tx: Tx, fallback: PgQueryRunner): PgQueryRunner {
  return (tx as PgQueryRunner | undefined)?.query ? (tx as PgQueryRunner) : fallback;
}

export interface PclPgOptions {
  pool: PgPool;
  /** Schema the PCL tables live in. Default 'pcl'. */
  schema?: string;
  stateTable?: string; // default 'payment_state'
  inboxTable?: string; // default 'payment_inbox'
  outboxTable?: string; // default 'payment_outbox'
}

/** A transaction runner backed by a node-postgres-style pool. */
export function createPgTxRunner(pool: PgPool): TxRunner {
  return {
    async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn(client);
        await client.query('COMMIT');
        return out;
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch {
          /* rollback best-effort; surface the original error */
        }
        throw err;
      } finally {
        client.release();
      }
    },
  };
}

function mapRecord(row: Record<string, unknown>): PaymentRecord {
  return {
    paymentId: String(row.payment_id),
    state: String(row.state) as PaymentState,
    version: Number(row.version ?? 1),
    provider: String(row.provider),
    transactionId: String(row.transaction_id),
    amountMinor: Number(row.amount_minor),
    currency: String(row.currency),
  };
}

export function createPgPaymentStateStore(opts: PclPgOptions): PaymentStateStore {
  const schema = quoteIdent(opts.schema ?? 'pcl');
  const table = `${schema}.${quoteIdent(opts.stateTable ?? 'payment_state')}`;
  const pool = opts.pool;
  return {
    async ensureAndLock(tx: Tx, event: PaymentEvent): Promise<PaymentRecord> {
      const r = runnerOf(tx, pool);
      // Seed at INITIATED if new; idempotent under the payment_id PK so concurrent first-events
      // can't both create. Then take the row lock for the rest of the transaction.
      await r.query(
        `INSERT INTO ${table}
           (payment_id, provider, transaction_id, amount_minor, currency, state, version, last_event_type, org_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'INITIATED', 1, $6, $7, now(), now())
         ON CONFLICT (payment_id) DO NOTHING`,
        [event.paymentId, event.provider, event.transactionId, event.amount, event.currency, event.type, event.orgId ?? null],
      );
      const { rows } = await r.query(`SELECT * FROM ${table} WHERE payment_id = $1 FOR UPDATE`, [event.paymentId]);
      if (!rows.length) {
        throw new Error(`[pcl] payment_state row vanished after upsert: ${event.paymentId}`);
      }
      return mapRecord(rows[0]);
    },
    async advance(tx: Tx, paymentId: string, toState: PaymentState, event: PaymentEvent): Promise<void> {
      const r = runnerOf(tx, pool);
      await r.query(
        `UPDATE ${table}
            SET state = $2,
                version = version + 1,
                last_event_type = $3,
                last_transaction_id = $4,
                updated_at = now()
          WHERE payment_id = $1`,
        [paymentId, toState, event.type, event.transactionId],
      );
    },
  };
}

export function createPgInboxStore(opts: PclPgOptions): InboxStore {
  const schema = quoteIdent(opts.schema ?? 'pcl');
  const table = `${schema}.${quoteIdent(opts.inboxTable ?? 'payment_inbox')}`;
  const pool = opts.pool;
  return {
    async claim(tx: Tx, key: string, event: PaymentEvent): Promise<boolean> {
      const r = runnerOf(tx, pool);
      const { rows } = await r.query(
        `INSERT INTO ${table} (dedupe_key, payment_id, event_type, transaction_id, received_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (dedupe_key) DO NOTHING
         RETURNING dedupe_key`,
        [key, event.paymentId, event.type, event.transactionId],
      );
      return rows.length === 1;
    },
  };
}

export function createPgOutboxWriter(opts: PclPgOptions): OutboxWriter {
  const schema = quoteIdent(opts.schema ?? 'pcl');
  const table = `${schema}.${quoteIdent(opts.outboxTable ?? 'payment_outbox')}`;
  const pool = opts.pool;
  return {
    async enqueue(tx: Tx, env: OutboxEnvelope): Promise<void> {
      const r = runnerOf(tx, pool);
      // `payload` is text (not jsonb) so the @baalvion/events relay's JSON.parse round-trips
      // a string unambiguously across drivers — identical contract to event_outbox.
      await r.query(
        `INSERT INTO ${table} (id, type, payload, org_id, status, attempts, available_at, created_at)
         VALUES ($1, $2, $3, $4, 'pending', 0, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        [env.id, env.type, JSON.stringify(env), env.orgId ?? null],
      );
    },
  };
}
