-- Open the freight marketplace to any onboarded ocean carrier.
--
-- Migration 016 pinned `freight_bookings.carrier` to the four carriers that had
-- bespoke connectors at the time (dhl/fedex/ups/maersk). The Carrier Directory
-- (migration 047) was built precisely so carriers could be onboarded as DATA rather
-- than code — GenericConnector serves any row that has no coded connector — but the
-- booking table's CHECK still rejected every one of them, so a directory carrier
-- could be quoted and never booked.
--
-- The column stays constrained to a sane shape (short, lower-case, non-empty) so it
-- remains a carrier code and not free text; WHICH carriers exist is now the
-- directory's business, not this constraint's.

ALTER TABLE tradeops.freight_bookings DROP CONSTRAINT IF EXISTS chk_freight_bookings_carrier;

ALTER TABLE tradeops.freight_bookings
    ADD CONSTRAINT chk_freight_bookings_carrier
    CHECK (carrier IS NULL OR carrier ~ '^[a-z0-9][a-z0-9_-]{1,31}$');
