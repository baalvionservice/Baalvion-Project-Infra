-- 089 down — remove the order journey and its parties.
DROP VIEW IF EXISTS tradeops.order_party_directory;
DROP FUNCTION IF EXISTS tradeops.create_journey(uuid, text, text, text, text, text, text, text, text, text, text[]);
DROP TABLE IF EXISTS tradeops.order_party_events;
DROP TABLE IF EXISTS tradeops.order_parties;
DROP TABLE IF EXISTS tradeops.order_journeys;
DROP FUNCTION IF EXISTS tradeops.guard_party_update();
DROP FUNCTION IF EXISTS tradeops.forbid_change();
DROP FUNCTION IF EXISTS tradeops.party_can(uuid, text, text);
DROP FUNCTION IF EXISTS tradeops.current_party_org();
