'use strict';
// Transactional outbox for order-service money events (ledger mirror).
//
// A captured payment / issued refund enqueues a `commerce.ledger.entry` event in the SAME
// transaction as the order/payment mutation; the ledger outbox relay then drains it to
// ledger-service (idempotent on transactionRef=pay-<paymentId> / refund-<refundId>), retrying with
// backoff and dead-lettering after the attempt cap. This replaces the post-commit fire-and-forget
// `safeLedger()` call, which silently dropped the ledger entry on a ledger outage or a crash between
// commit and the HTTP call.
//
// No RLS: the relay reads cross-store, so this is a relay-internal table isolated by owner-only
// grants + the `org_id`/payload tenant — same decision as the Java finance suite's relay tables.
// Payload is `text` (not jsonb) so the relay's JSON.parse round-trips a string unambiguously.
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS orders.event_outbox (
                id           uuid PRIMARY KEY,
                type         varchar(160) NOT NULL,
                payload      text NOT NULL,
                org_id       uuid,
                status       varchar(16) NOT NULL DEFAULT 'pending',
                attempts     int NOT NULL DEFAULT 0,
                last_error   text,
                available_at timestamptz NOT NULL DEFAULT now(),
                created_at   timestamptz NOT NULL DEFAULT now(),
                sent_at      timestamptz,
                CONSTRAINT event_outbox_status_chk CHECK (status IN ('pending','sent','failed'))
            );
        `);
        await queryInterface.sequelize.query(
            'CREATE INDEX IF NOT EXISTS event_outbox_claim_idx ON orders.event_outbox (status, available_at);',
        );
        // Grant the non-superuser runtime role DML, mirroring the platform grant pattern. Role-guarded
        // so it is safe on databases where baalvion_app has not been provisioned yet.
        await queryInterface.sequelize.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
                    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON orders.event_outbox TO baalvion_app';
                END IF;
            END$$;
        `);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS orders.event_outbox;');
    },
};
