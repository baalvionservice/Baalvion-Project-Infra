'use strict';
// Cart-activity projection for admin visibility ("what is a user dropping in their cart, right
// now, before they check out"). Populated by cartEventsOutbox.js's relay consumer
// (cartEventsPublisher.js) draining the SAME orders.event_outbox table the ledger outbox already
// uses — no new outbox table, just new `type` values (commerce.cart.item_added etc.) written to
// this projection instead of relayed out via HTTP. Postgres, not ClickHouse: reuses all existing
// infra (Sequelize, migrations, RBAC) and is sufficient at current scale — see the Phase 3 plan
// notes for why ClickHouse was deliberately deferred.
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS orders.cart_events (
                id               uuid PRIMARY KEY,
                cart_id          uuid NOT NULL,
                store_id         uuid NOT NULL,
                user_id          bigint,
                -- SHA-256 of the guest session id, never the raw value -- matches cartService.js's
                -- existing discipline of never persisting/returning the raw sessionId (see present()).
                session_id_hash  varchar(64),
                event_type       varchar(40) NOT NULL,
                item_snapshot    jsonb,
                cart_snapshot    jsonb NOT NULL,
                occurred_at      timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT cart_events_type_chk CHECK (event_type IN
                    ('item_added','item_updated','item_removed','cart_cleared','cart_claimed'))
            );
        `);
        await queryInterface.sequelize.query(
            'CREATE INDEX IF NOT EXISTS cart_events_store_occurred_idx ON orders.cart_events (store_id, occurred_at DESC);',
        );
        await queryInterface.sequelize.query(
            'CREATE INDEX IF NOT EXISTS cart_events_user_idx ON orders.cart_events (user_id) WHERE user_id IS NOT NULL;',
        );
        await queryInterface.sequelize.query(
            'CREATE INDEX IF NOT EXISTS cart_events_cart_idx ON orders.cart_events (cart_id);',
        );
        await queryInterface.sequelize.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
                    EXECUTE 'GRANT SELECT, INSERT ON orders.cart_events TO baalvion_app';
                END IF;
            END$$;
        `);
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS orders.cart_events;');
    },
};
