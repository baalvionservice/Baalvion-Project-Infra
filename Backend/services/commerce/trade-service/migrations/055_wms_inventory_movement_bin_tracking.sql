-- 055 — Warehouse Management System, Phase A: bin-level movement tracking +
-- permission seed.
--
--   • tradeops.inventory_movements gains from_bin_id/to_bin_id — an `inbound`
--     movement (putaway completion) only ever populates to_bin_id; an
--     `outbound` movement only from_bin_id; this generically supports future
--     bin-to-bin transfers (Phase B) without another schema change.
--   • Seeds the WAREHOUSE_ZONE_MANAGE/WAREHOUSE_RECEIVE/WAREHOUSE_PUTAWAY
--     permission rows into the existing tradeops.logistics_role_permissions
--     catalog (see migration 042). Unlike 042's one-time seed, this migration
--     ADDS to an already-seeded table, so the insert must be conflict-safe.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies.

ALTER TABLE tradeops.inventory_movements ADD COLUMN IF NOT EXISTS from_bin_id uuid;
ALTER TABLE tradeops.inventory_movements ADD COLUMN IF NOT EXISTS to_bin_id uuid;
ALTER TABLE tradeops.inventory_movements ADD CONSTRAINT fk_inventory_movements_from_bin FOREIGN KEY (from_bin_id) REFERENCES tradeops.warehouse_bins (id) ON DELETE SET NULL;
ALTER TABLE tradeops.inventory_movements ADD CONSTRAINT fk_inventory_movements_to_bin FOREIGN KEY (to_bin_id) REFERENCES tradeops.warehouse_bins (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_from_bin ON tradeops.inventory_movements (from_bin_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_to_bin ON tradeops.inventory_movements (to_bin_id);

INSERT INTO tradeops.logistics_role_permissions (role, permission, description) VALUES
    ('warehouse_manager', 'logistics:warehouse:zone_manage', 'Manage warehouse zones and bins'),
    ('inventory_manager',  'logistics:warehouse:zone_manage', 'Manage warehouse zones and bins'),
    ('warehouse_manager', 'logistics:warehouse:receive',     'Create receiving / GRN records'),
    ('inventory_manager',  'logistics:warehouse:receive',     'Create receiving / GRN records'),
    ('warehouse_manager', 'logistics:warehouse:putaway',     'Execute/override putaway tasks'),
    ('inventory_manager',  'logistics:warehouse:putaway',     'Execute/override putaway tasks')
ON CONFLICT (role, permission) DO NOTHING;
