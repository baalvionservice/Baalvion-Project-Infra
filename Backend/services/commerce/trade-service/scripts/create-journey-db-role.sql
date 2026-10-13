-- Creates the restricted database role the order-journey module can connect as, so the row-level
-- rules in migration 089 are enforced by Postgres itself and not only by the application.
--
--   psql "$ADMIN_DATABASE_URL" -v journey_password="'<a long random password>'" -f scripts/create-journey-db-role.sql
--
-- NOSUPERUSER and NOBYPASSRLS are the point: a superuser ignores every row-level policy. Set
-- JOURNEY_DB_USER=baalvion_journey and JOURNEY_DB_PASSWORD in the trade-service environment to switch
-- the module over. Without them it still works and says "application-only" on /v1/order_journeys/_status.
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_journey') THEN CREATE ROLE baalvion_journey LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE; END IF; END $$;
ALTER ROLE baalvion_journey WITH PASSWORD :journey_password;
GRANT USAGE ON SCHEMA tradeops TO baalvion_journey;
GRANT SELECT, UPDATE ON tradeops.order_journeys TO baalvion_journey;
GRANT SELECT, INSERT, UPDATE ON tradeops.order_parties TO baalvion_journey;
GRANT SELECT, INSERT ON tradeops.order_party_events TO baalvion_journey;
GRANT SELECT ON tradeops.order_party_directory TO baalvion_journey;
GRANT EXECUTE ON FUNCTION tradeops.current_party_org() TO baalvion_journey;
GRANT EXECUTE ON FUNCTION tradeops.party_can(uuid, text, text) TO baalvion_journey;
GRANT EXECUTE ON FUNCTION tradeops.create_journey(uuid, text, text, text, text, text, text, text, text, text, text[]) TO baalvion_journey;
