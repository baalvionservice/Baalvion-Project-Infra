-- Restore the four-carrier allow-list. Any booking on a directory-onboarded carrier
-- must be cleared first or the constraint will not validate.
ALTER TABLE tradeops.freight_bookings DROP CONSTRAINT IF EXISTS chk_freight_bookings_carrier;

ALTER TABLE tradeops.freight_bookings
    ADD CONSTRAINT chk_freight_bookings_carrier
    CHECK (carrier IS NULL OR carrier = ANY (ARRAY['dhl', 'fedex', 'ups', 'maersk']));
