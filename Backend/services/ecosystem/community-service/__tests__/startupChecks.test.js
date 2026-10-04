'use strict';
const { status } = require('../service/startupChecks');

describe('startup capability report', () => {
    const on = { isConfigured: () => true };
    const off = { isConfigured: () => false };

    it('flags a missing KYC key as disabled', () => {
        expect(status({}, off).kyc).toMatch(/^DISABLED/);
        expect(status({}, on).kyc).toBe('enabled');
    });

    it('needs both URL and secret for email, and an address for admin alerts', () => {
        expect(status({ NOTIFICATION_BASE_URL: 'http://n', INTERNAL_SERVICE_SECRET: 's' }, on).email).toBe('enabled');
        expect(status({ NOTIFICATION_BASE_URL: 'http://n' }, on).email).toMatch(/^disabled/);
        expect(status({ INTERNAL_SERVICE_SECRET: 's' }, on).email).toMatch(/^disabled/);
        expect(status({ ADMIN_ALERT_EMAIL: 'ops@x.com' }, on).adminAlerts).toBe('enabled');
        expect(status({}, on).adminAlerts).toMatch(/^disabled/);
    });
});
