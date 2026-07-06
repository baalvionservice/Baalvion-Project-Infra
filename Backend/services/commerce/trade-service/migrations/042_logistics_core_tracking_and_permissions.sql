-- 042 — Logistics Core Foundation, Phase 1: GPS/carrier tracking events +
-- logistics role->permission catalog.
--
--   • tradeops.tracking_events — high-volume, append-only location telemetry
--     (HIGH VOLUME like tradeops.shipment_events — see migration 009 comment on
--     partitioning at scale). BRIN index on occurred_at for cheap time-range scans.
--   • tradeops.logistics_role_permissions — GLOBAL reference data (no tenant_id,
--     like tradeops.hs_codes) documenting the role -> permission matrix that
--     middleware/permissions.js's LOGISTICS_PERMISSIONS catalog expects
--     identity/rbac-service to eventually issue. Seeded with the roles listed
--     in the Logistics Core Foundation spec.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.tracking_events (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id     uuid          NOT NULL,
    container_id    uuid,
    source          text          NOT NULL DEFAULT 'manual',
    event_type      text          NOT NULL,
    description     text,
    latitude        numeric(9,6),
    longitude       numeric(9,6),
    location_label  text,
    occurred_at     timestamptz   NOT NULL DEFAULT now(),
    raw_payload     jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_tracking_events_shipment  FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT fk_tracking_events_container FOREIGN KEY (container_id) REFERENCES tradeops.containers (id) ON DELETE SET NULL,
    CONSTRAINT chk_tracking_events_source CHECK (source IN ('carrier_webhook','gps_device','manual'))
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_tenant       ON tradeops.tracking_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment     ON tradeops.tracking_events (shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_container    ON tradeops.tracking_events (container_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_occurred_brin ON tradeops.tracking_events USING brin (occurred_at);

ALTER TABLE tradeops.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.tracking_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.tracking_events;
CREATE POLICY tenant_isolation ON tradeops.tracking_events
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.logistics_role_permissions (
    id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    role        text          NOT NULL,
    permission  text          NOT NULL,
    description text,
    created_at  timestamptz   NOT NULL DEFAULT now(),
    updated_at  timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_logistics_role_permissions UNIQUE (role, permission)
);

CREATE INDEX IF NOT EXISTS idx_logistics_role_permissions_role ON tradeops.logistics_role_permissions (role);

-- Seed: super_admin / org_owner get the full catalog implicitly via the
-- requireRole admin bypass in middleware/permissions.js, so they are not
-- enumerated row-by-row here. This seeds the operational roles instead.
INSERT INTO tradeops.logistics_role_permissions (role, permission, description) VALUES
    ('logistics_director',   'logistics:shipment:create',      'Create shipments'),
    ('logistics_director',   'logistics:shipment:update',      'Update shipments'),
    ('logistics_director',   'logistics:shipment:cancel',      'Cancel shipments'),
    ('logistics_director',   'logistics:booking:approve',      'Approve bookings'),
    ('logistics_director',   'logistics:cost:view',            'View shipment cost'),
    ('logistics_director',   'logistics:cost:approve',         'Approve shipment cost'),
    ('logistics_director',   'logistics:report:export',        'Export logistics reports'),
    ('supply_chain_manager', 'logistics:shipment:create',      'Create shipments'),
    ('supply_chain_manager', 'logistics:shipment:update',      'Update shipments'),
    ('supply_chain_manager', 'logistics:container:manage',     'Manage containers'),
    ('supply_chain_manager', 'logistics:warehouse:manage',     'Manage warehouses'),
    ('supply_chain_manager', 'logistics:report:export',        'Export logistics reports'),
    ('shipping_manager',     'logistics:shipment:create',      'Create shipments'),
    ('shipping_manager',     'logistics:shipment:update',      'Update shipments'),
    ('shipping_manager',     'logistics:booking:approve',      'Approve bookings'),
    ('shipping_manager',     'logistics:label:generate',       'Generate shipping labels'),
    ('warehouse_manager',    'logistics:warehouse:manage',     'Manage warehouses'),
    ('warehouse_manager',    'logistics:container:manage',     'Manage containers'),
    ('inventory_manager',    'logistics:warehouse:manage',     'Manage warehouses'),
    ('fleet_manager',        'logistics:fleet:manage',         'Manage fleet'),
    ('fleet_manager',        'logistics:driver:assign',        'Assign drivers'),
    ('dispatch_manager',     'logistics:driver:assign',        'Assign drivers'),
    ('dispatch_manager',     'logistics:tracking:manage',      'Manage tracking events'),
    ('freight_forwarder',    'logistics:booking:approve',      'Approve bookings'),
    ('freight_forwarder',    'logistics:document:upload_bol',  'Upload bill of lading'),
    ('carrier',              'logistics:tracking:manage',      'Manage tracking events'),
    ('carrier',              'logistics:driver:assign',        'Assign drivers'),
    ('shipping_agent',       'logistics:document:upload_bol',  'Upload bill of lading'),
    ('shipping_agent',       'logistics:label:generate',       'Generate shipping labels'),
    ('customs_broker',       'logistics:customs:view',         'View customs data'),
    ('customs_broker',       'logistics:document:download',    'Download trade documents'),
    ('port_operator',        'logistics:container:manage',     'Manage containers'),
    ('port_operator',        'logistics:tracking:manage',      'Manage tracking events'),
    ('airport_operator',     'logistics:container:manage',     'Manage containers'),
    ('airport_operator',     'logistics:tracking:manage',      'Manage tracking events'),
    ('rail_operator',        'logistics:container:manage',     'Manage containers'),
    ('rail_operator',        'logistics:tracking:manage',      'Manage tracking events'),
    ('truck_driver',         'logistics:tracking:manage',      'Manage tracking events'),
    ('delivery_partner',     'logistics:tracking:manage',      'Manage tracking events'),
    ('buyer',                'logistics:cost:view',            'View shipment cost'),
    ('seller',               'logistics:shipment:create',      'Create shipments'),
    ('importer',             'logistics:customs:view',         'View customs data'),
    ('exporter',             'logistics:customs:view',         'View customs data'),
    ('vendor',               'logistics:cost:view',            'View shipment cost'),
    ('customer',             'logistics:document:download',    'Download trade documents'),
    ('finance_team',         'logistics:cost:view',            'View shipment cost'),
    ('finance_team',         'logistics:cost:approve',         'Approve shipment cost'),
    ('support_team',         'logistics:tracking:manage',      'Manage tracking events'),
    ('auditor',              'logistics:report:export',        'Export logistics reports'),
    ('auditor',              'logistics:document:download',    'Download trade documents'),
    ('read_only',            'logistics:cost:view',            'View shipment cost')
ON CONFLICT (role, permission) DO NOTHING;
