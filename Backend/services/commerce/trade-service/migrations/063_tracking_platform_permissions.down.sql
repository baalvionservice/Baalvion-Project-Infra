-- Down for 063.
DELETE FROM tradeops.logistics_role_permissions
WHERE permission IN (
    'logistics:geofence:manage',
    'logistics:checkpoint:manage',
    'logistics:alert:manage',
    'logistics:iot:manage',
    'logistics:pod:capture',
    'logistics:eta:view',
    'logistics:tracking:search',
    'logistics:tracking_report:export'
);
