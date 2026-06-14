'use strict';

// Known placeholder values that indicate credentials have not been set.
const PLACEHOLDER_VALUES = new Set(['encrypted-secret', 'changeme', 'placeholder', '', 'secret', 'your-secret']);

function assertCredential(value, name) {
    if (!value || PLACEHOLDER_VALUES.has(value.toLowerCase())) {
        throw new Error(`BrightDataAdapter: ${name} is not configured. Set the BRIGHT_DATA_${name.toUpperCase().replace(/-/g, '_')} environment variable.`);
    }
}

class BrightDataAdapter {
    constructor() {
        this.username = process.env.BRIGHT_DATA_USERNAME || '';
        this.password = process.env.BRIGHT_DATA_PASSWORD || '';
        this.host = process.env.BRIGHT_DATA_HOST || '';
        this.port = Number(process.env.BRIGHT_DATA_PORT || 24000);
    }

    _assertConfigured() {
        assertCredential(this.username, 'username');
        assertCredential(this.password, 'password');
        assertCredential(this.host, 'host');
    }

    async authenticate() {
        this._assertConfigured();
        return true;
    }

    async allocateIP(options) {
        this._assertConfigured();
        return { host: this.host, port: this.port, user: this.username, pass: this.password, country: options.country || 'us' };
    }

    async releaseIP() {
        this._assertConfigured();
        return true;
    }

    async rotateIP(proxyId) {
        this._assertConfigured();
        return { host: this.host, port: this.port + 1, proxyId };
    }

    async healthCheck() {
        this._assertConfigured();
        return { latency: null, successRate: null, status: 'unknown' };
    }

    async getUsage() {
        this._assertConfigured();
        return { bandwidth: null, requests: null };
    }
}

module.exports = BrightDataAdapter;