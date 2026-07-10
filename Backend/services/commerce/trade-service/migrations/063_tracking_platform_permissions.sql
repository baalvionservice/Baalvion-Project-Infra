-- 063 — Shipment Tracking & Global Visibility Platform: role -> permission
-- catalog seed for the new tracking-platform permission strings introduced
-- in middleware/permissions.js. Reference data only (see migration 042
-- comment) — actual enforcement is requirePermission() against the
-- gateway-issued req.auth.permissions; super_admin/admin/owner bypass via
-- ADMIN_BYPASS_ROLES regardless of what is seeded here.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies.

INSERT INTO tradeops.logistics_role_permissions (role, permission, description) VALUES
    ('seller',               'logistics:geofence:manage',      'Manage geofences for own shipments'),
    ('seller',               'logistics:checkpoint:manage',    'Record shipment checkpoints'),
    ('seller',               'logistics:tracking_report:export','Export tracking reports'),
    ('buyer_agent',          'logistics:eta:view',             'View ETA predictions for assigned shipments'),
    ('buyer_agent',          'logistics:alert:manage',         'Acknowledge/resolve shipment alerts'),
    ('seller_agent',         'logistics:eta:view',             'View ETA predictions for assigned export shipments'),
    ('seller_agent',         'logistics:checkpoint:manage',    'Record export shipment checkpoints'),
    ('logistics_provider',   'logistics:geofence:manage',      'Manage geofences'),
    ('logistics_provider',   'logistics:checkpoint:manage',    'Manage shipment checkpoints'),
    ('logistics_provider',   'logistics:alert:manage',         'Manage shipment alerts'),
    ('logistics_provider',   'logistics:iot:manage',           'Manage IoT devices and sensor thresholds'),
    ('logistics_provider',   'logistics:tracking_report:export','Export tracking reports'),
    ('carrier',              'logistics:checkpoint:manage',    'Confirm pickups/departures/arrivals'),
    ('carrier',              'logistics:pod:capture',          'Upload proof of delivery'),
    ('truck_driver',         'logistics:pod:capture',          'Capture proof of delivery from mobile'),
    ('warehouse_manager',    'logistics:checkpoint:manage',    'Record warehouse receiving/dispatch checkpoints'),
    ('customs_broker',       'logistics:checkpoint:manage',    'Update customs clearance checkpoints'),
    ('customs_broker',       'logistics:alert:manage',         'Manage customs-hold alerts'),
    ('field_operations',     'logistics:checkpoint:manage',    'Record field inspection checkpoints'),
    ('field_operations',     'logistics:pod:capture',          'Capture field inspection evidence'),
    ('finance_team',         'logistics:eta:view',             'View shipment ETA for milestone-based payment release'),
    ('insurance_provider',   'logistics:eta:view',             'View incident-relevant shipment/sensor history')
ON CONFLICT (role, permission) DO NOTHING;
