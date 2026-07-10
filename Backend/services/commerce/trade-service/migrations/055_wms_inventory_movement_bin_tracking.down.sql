-- Down for 055.
DELETE FROM tradeops.logistics_role_permissions WHERE permission IN ('logistics:warehouse:zone_manage', 'logistics:warehouse:receive', 'logistics:warehouse:putaway');

ALTER TABLE tradeops.inventory_movements DROP CONSTRAINT IF EXISTS fk_inventory_movements_to_bin;
ALTER TABLE tradeops.inventory_movements DROP CONSTRAINT IF EXISTS fk_inventory_movements_from_bin;
ALTER TABLE tradeops.inventory_movements DROP COLUMN IF EXISTS to_bin_id;
ALTER TABLE tradeops.inventory_movements DROP COLUMN IF EXISTS from_bin_id;
