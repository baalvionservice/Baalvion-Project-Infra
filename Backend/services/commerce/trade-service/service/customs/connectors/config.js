'use strict';
/**
 * Government gateway configuration + readiness (Customs Connectors, real-integration build).
 *
 * There is no simulator behind these connectors. A gateway that is not fully
 * configured REFUSES to transmit and says exactly which credentials are missing
 * and where each one comes from. That is the whole point of this module: the
 * failure mode of an unconfigured production filing path must be a loud,
 * specific error at the boundary — never a plausible-looking fake acknowledgement
 * that lets a shipment proceed as though it had been filed.
 *
 * Every gateway here needs the same three classes of material, and none of them
 * can be invented:
 *
 *   TRANSPORT IDENTITY   a client certificate + private key for mutual TLS, plus
 *                        the authority's CA bundle to verify the server. Issued
 *                        as part of enrolment.
 *   MESSAGE IDENTITY     the participant/filer id the authority assigns you
 *                        (ICEGATE id, ABI filer code, EORI, business code).
 *   SIGNING MATERIAL     where the jurisdiction requires the message body itself
 *                        to be signed, separately from the TLS channel.
 *
 * `kind: 'file'` fields are checked for existence and readability at resolve
 * time. A mistyped certificate path is the single most common integration
 * failure, and it should surface on a readiness check rather than at 03:00 on
 * the first live filing.
 */

const fs = require('fs');
const path = require('path');

const { CHANNEL, FAILURE_KIND, GatewayError } = require('../schema');

/**
 * Field kinds:
 *   value  a plain string (ids, codes)
 *   url    must parse as https:
 *   file   must exist and be readable at resolve time
 *   enum   must be one of `values`
 */
const CHANNEL_CONFIG = Object.freeze({
    [CHANNEL.ICEGATE]: {
        label: 'ICEGATE',
        authority: 'Central Board of Indirect Taxes and Customs (CBIC), India',
        enrolment: 'ICEGATE registration + Message Exchange Facility (MEF) enrolment. Requires a Class-3 Digital Signature Certificate registered against the ICEGATE id.',
        message_format: 'XML (Bill of Entry / Shipping Bill), digitally signed',
        fields: [
            { key: 'endpoint', env: 'ICEGATE_ENDPOINT', kind: 'url', required: true, description: 'ICEGATE message-exchange submission endpoint', obtained_from: 'ICEGATE MEF enrolment pack' },
            { key: 'statusEndpoint', env: 'ICEGATE_STATUS_ENDPOINT', kind: 'url', required: false, description: 'Endpoint for polling a filing status; defaults to the submission endpoint', obtained_from: 'ICEGATE MEF enrolment pack' },
            { key: 'icegateId', env: 'ICEGATE_ID', kind: 'value', required: true, description: 'Your registered ICEGATE user id', obtained_from: 'ICEGATE registration' },
            { key: 'locationCode', env: 'ICEGATE_LOCATION_CODE', kind: 'value', required: true, description: 'Customs location / port code you are filing at (e.g. INNSA1)', obtained_from: 'CBIC customs location directory' },
            { key: 'clientCertPath', env: 'ICEGATE_CLIENT_CERT', kind: 'file', required: true, description: 'Mutual-TLS client certificate (PEM)', obtained_from: 'ICEGATE enrolment' },
            { key: 'clientKeyPath', env: 'ICEGATE_CLIENT_KEY', kind: 'file', required: true, secret: true, description: 'Mutual-TLS client private key (PEM)', obtained_from: 'generated locally; CSR submitted at enrolment' },
            { key: 'clientKeyPassphrase', env: 'ICEGATE_CLIENT_KEY_PASSPHRASE', kind: 'value', required: false, secret: true, description: 'Passphrase for the client key, if encrypted' },
            { key: 'caBundlePath', env: 'ICEGATE_CA_BUNDLE', kind: 'file', required: true, description: 'CA bundle used to verify the ICEGATE server certificate', obtained_from: 'ICEGATE enrolment pack' },
            { key: 'signingCertPath', env: 'ICEGATE_DSC_CERT', kind: 'file', required: true, description: 'Class-3 DSC public certificate (PEM) used to sign the message body', obtained_from: 'Licensed Indian Certifying Authority' },
            { key: 'signingKeyPath', env: 'ICEGATE_DSC_KEY', kind: 'file', required: true, secret: true, description: 'DSC private key (PEM)', obtained_from: 'Licensed Indian Certifying Authority' },
            { key: 'signingKeyPassphrase', env: 'ICEGATE_DSC_KEY_PASSPHRASE', kind: 'value', required: false, secret: true, description: 'Passphrase for the DSC key' },
        ],
    },

    [CHANNEL.ACE]: {
        label: 'CBP ACE',
        authority: 'US Customs and Border Protection',
        enrolment: 'ABI (Automated Broker Interface) participation. Requires a CBP-assigned filer code and completion of ACE certification testing before production access is granted.',
        message_format: 'CATAIR fixed-width records over the ABI channel',
        fields: [
            { key: 'endpoint', env: 'ACE_ENDPOINT', kind: 'url', required: true, description: 'ACE/ABI message submission endpoint', obtained_from: 'CBP client representative on ABI approval' },
            { key: 'statusEndpoint', env: 'ACE_STATUS_ENDPOINT', kind: 'url', required: false, description: 'Endpoint for retrieving ABI response messages' },
            { key: 'filerCode', env: 'ACE_FILER_CODE', kind: 'value', required: true, description: 'CBP-assigned three-character filer code', obtained_from: 'CBP on ABI approval' },
            { key: 'senderId', env: 'ACE_SENDER_ID', kind: 'value', required: true, description: 'ABI sender identifier used in the message header', obtained_from: 'CBP client representative' },
            { key: 'clientCertPath', env: 'ACE_CLIENT_CERT', kind: 'file', required: true, description: 'Mutual-TLS client certificate (PEM)', obtained_from: 'CBP connectivity setup' },
            { key: 'clientKeyPath', env: 'ACE_CLIENT_KEY', kind: 'file', required: true, secret: true, description: 'Mutual-TLS client private key (PEM)' },
            { key: 'clientKeyPassphrase', env: 'ACE_CLIENT_KEY_PASSPHRASE', kind: 'value', required: false, secret: true, description: 'Passphrase for the client key, if encrypted' },
            { key: 'caBundlePath', env: 'ACE_CA_BUNDLE', kind: 'file', required: true, description: 'CA bundle used to verify the CBP server certificate' },
        ],
    },

    [CHANNEL.EU_CDS]: {
        label: 'EU customs (national UCC system / ICS2)',
        authority: 'National customs administration of the member state of declaration',
        enrolment: 'EORI registration plus per-member-state system enrolment. There is no single EU endpoint — declarations are lodged with the member state, so the endpoint and message version are member-state specific.',
        message_format: 'UCC XML declaration; ICS2 for entry summary declarations',
        fields: [
            { key: 'endpoint', env: 'EU_CDS_ENDPOINT', kind: 'url', required: true, description: 'Member-state declaration submission endpoint', obtained_from: 'National customs administration' },
            { key: 'statusEndpoint', env: 'EU_CDS_STATUS_ENDPOINT', kind: 'url', required: false, description: 'Endpoint for retrieving declaration status notifications' },
            { key: 'memberState', env: 'EU_CDS_MEMBER_STATE', kind: 'value', required: true, description: 'ISO-2 code of the member state of declaration (decides endpoint and codelists)', obtained_from: 'your own customs registration' },
            { key: 'eori', env: 'EU_CDS_EORI', kind: 'value', required: true, description: 'Your EORI number, used as the declarant identifier', obtained_from: 'EORI registration' },
            { key: 'clientCertPath', env: 'EU_CDS_CLIENT_CERT', kind: 'file', required: true, description: 'Mutual-TLS client certificate (PEM)', obtained_from: 'member-state system enrolment' },
            { key: 'clientKeyPath', env: 'EU_CDS_CLIENT_KEY', kind: 'file', required: true, secret: true, description: 'Mutual-TLS client private key (PEM)' },
            { key: 'clientKeyPassphrase', env: 'EU_CDS_CLIENT_KEY_PASSPHRASE', kind: 'value', required: false, secret: true, description: 'Passphrase for the client key, if encrypted' },
            { key: 'caBundlePath', env: 'EU_CDS_CA_BUNDLE', kind: 'file', required: true, description: 'CA bundle used to verify the member-state server certificate' },
            { key: 'signingCertPath', env: 'EU_CDS_SIGNING_CERT', kind: 'file', required: false, description: 'Certificate for message-level signing, where the member state requires it in addition to mutual TLS' },
            { key: 'signingKeyPath', env: 'EU_CDS_SIGNING_KEY', kind: 'file', required: false, secret: true, description: 'Private key for message-level signing' },
        ],
    },

    [CHANNEL.UAE_MIRSAL]: {
        label: 'Mirsal 2',
        authority: 'Dubai Customs',
        enrolment: 'Dubai Trade business registration with a customs client code, plus system-integration approval.',
        message_format: 'XML declaration over the Dubai Trade integration channel',
        fields: [
            { key: 'endpoint', env: 'MIRSAL_ENDPOINT', kind: 'url', required: true, description: 'Mirsal 2 declaration submission endpoint', obtained_from: 'Dubai Trade integration pack' },
            { key: 'statusEndpoint', env: 'MIRSAL_STATUS_ENDPOINT', kind: 'url', required: false, description: 'Endpoint for polling declaration status' },
            { key: 'businessCode', env: 'MIRSAL_BUSINESS_CODE', kind: 'value', required: true, description: 'Dubai Customs client / business code', obtained_from: 'Dubai Trade registration' },
            { key: 'username', env: 'MIRSAL_USERNAME', kind: 'value', required: true, description: 'Integration account username', obtained_from: 'Dubai Trade' },
            { key: 'password', env: 'MIRSAL_PASSWORD', kind: 'value', required: true, secret: true, description: 'Integration account password', obtained_from: 'Dubai Trade' },
            { key: 'clientCertPath', env: 'MIRSAL_CLIENT_CERT', kind: 'file', required: true, description: 'Mutual-TLS client certificate (PEM)' },
            { key: 'clientKeyPath', env: 'MIRSAL_CLIENT_KEY', kind: 'file', required: true, secret: true, description: 'Mutual-TLS client private key (PEM)' },
            { key: 'clientKeyPassphrase', env: 'MIRSAL_CLIENT_KEY_PASSPHRASE', kind: 'value', required: false, secret: true, description: 'Passphrase for the client key, if encrypted' },
            { key: 'caBundlePath', env: 'MIRSAL_CA_BUNDLE', kind: 'file', required: true, description: 'CA bundle used to verify the Dubai Trade server certificate' },
        ],
    },

    [CHANNEL.CHINA_SINGLE_WINDOW]: {
        label: 'China International Trade Single Window',
        authority: 'General Administration of Customs of China (GACC)',
        enrolment: 'GACC enterprise registration with a customs registration code, plus Single Window system access. Message signing uses a certificate issued by an approved Chinese CA.',
        message_format: 'XML declaration over the Single Window channel, signed',
        fields: [
            { key: 'endpoint', env: 'CHINA_SW_ENDPOINT', kind: 'url', required: true, description: 'Single Window declaration submission endpoint', obtained_from: 'Single Window integration pack' },
            { key: 'statusEndpoint', env: 'CHINA_SW_STATUS_ENDPOINT', kind: 'url', required: false, description: 'Endpoint for polling declaration status' },
            { key: 'customsCode', env: 'CHINA_SW_CUSTOMS_CODE', kind: 'value', required: true, description: 'GACC customs registration code for the declaring enterprise', obtained_from: 'GACC enterprise registration' },
            { key: 'declarantCode', env: 'CHINA_SW_DECLARANT_CODE', kind: 'value', required: true, description: 'Registered declarant / agent code', obtained_from: 'GACC enterprise registration' },
            { key: 'clientCertPath', env: 'CHINA_SW_CLIENT_CERT', kind: 'file', required: true, description: 'Mutual-TLS client certificate (PEM)' },
            { key: 'clientKeyPath', env: 'CHINA_SW_CLIENT_KEY', kind: 'file', required: true, secret: true, description: 'Mutual-TLS client private key (PEM)' },
            { key: 'clientKeyPassphrase', env: 'CHINA_SW_CLIENT_KEY_PASSPHRASE', kind: 'value', required: false, secret: true, description: 'Passphrase for the client key, if encrypted' },
            { key: 'caBundlePath', env: 'CHINA_SW_CA_BUNDLE', kind: 'file', required: true, description: 'CA bundle used to verify the Single Window server certificate' },
            { key: 'signingCertPath', env: 'CHINA_SW_SIGNING_CERT', kind: 'file', required: true, description: 'Message-signing certificate (PEM) from an approved CA', obtained_from: 'approved Chinese certification authority' },
            { key: 'signingKeyPath', env: 'CHINA_SW_SIGNING_KEY', kind: 'file', required: true, secret: true, description: 'Message-signing private key (PEM)' },
            { key: 'signingKeyPassphrase', env: 'CHINA_SW_SIGNING_KEY_PASSPHRASE', kind: 'value', required: false, secret: true, description: 'Passphrase for the signing key' },
        ],
    },
});

/** Thrown when a transmission is attempted against an unconfigured gateway. */
class GatewayNotConfiguredError extends GatewayError {
    constructor(channel, missing, meta = {}) {
        const label = (CHANNEL_CONFIG[channel] || {}).label || channel;
        super({
            // PERMANENT, not transient: retrying will not conjure a certificate,
            // and a durable queue must not spin on this.
            kind: FAILURE_KIND.PERMANENT,
            channel,
            code: 'GATEWAY_NOT_CONFIGURED',
            message: `${label} is not configured — ${missing.length} required setting(s) missing. `
                + `Set: ${missing.map((m) => m.env).join(', ')}. `
                + 'No filing was transmitted.',
            messages: missing.map((m) => ({
                code: m.env,
                level: 'error',
                text: `${m.env} — ${m.description}${m.obtained_from ? ` (from: ${m.obtained_from})` : ''}${m.problem ? ` [${m.problem}]` : ''}`,
            })),
        });
        this.name = 'GatewayNotConfiguredError';
        // PERMANENT so nothing auto-retries it — no backoff produces a
        // certificate. But RECOVERABLE, because installing the credential and
        // re-driving is exactly the fix, and the declaration itself was never
        // rejected. The gateway uses this to land the submission in `failed`
        // (retryable) rather than `rejected` (a terminal business rejection),
        // which would otherwise write off every filing made before an
        // integration went live.
        this.recoverable = true;
        this.missing = missing;
        this.enrolment = (CHANNEL_CONFIG[channel] || {}).enrolment || null;
        this.meta = meta;
    }
}

const envValue = (name, env) => {
    const v = env[name];
    return v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim();
};

/** Validate one field, returning a problem string or null. */
function fieldProblem(field, value) {
    if (value === null) return field.required ? 'not set' : null;

    if (field.kind === 'url') {
        let u;
        try { u = new URL(value); } catch { return 'is not a valid URL'; }
        // Plain HTTP to a customs authority would put a signed declaration and a
        // client credential on the wire in clear text.
        if (u.protocol !== 'https:') return 'must be an https URL';
        return null;
    }

    if (field.kind === 'file') {
        const resolved = path.resolve(value);
        try {
            fs.accessSync(resolved, fs.constants.R_OK);
        } catch {
            return `file not found or not readable at ${resolved}`;
        }
        const stat = fs.statSync(resolved);
        if (!stat.isFile()) return `${resolved} is not a file`;
        if (stat.size === 0) return `${resolved} is empty`;
        return null;
    }

    if (field.kind === 'enum' && Array.isArray(field.values) && !field.values.includes(value)) {
        return `must be one of ${field.values.join(', ')}`;
    }

    return null;
}

/**
 * Resolve a channel's configuration from the environment (or an override bag,
 * which tests and multi-tenant credential stores use).
 *
 * Never throws: it reports. `assertConfigured()` is the throwing form.
 */
function resolve(channel, { env = process.env, overrides = {} } = {}) {
    const spec = CHANNEL_CONFIG[channel];
    if (!spec) {
        return {
            channel,
            configured: false,
            config: {},
            missing: [{ env: '(unknown channel)', description: `No gateway configuration is defined for channel '${channel}'`, problem: 'unknown channel' }],
            present: [],
        };
    }

    const config = {};
    const missing = [];
    const present = [];

    for (const field of spec.fields) {
        const raw = overrides[field.key] !== undefined ? overrides[field.key] : envValue(field.env, env);
        const value = raw === undefined || raw === null || String(raw).trim() === '' ? null : String(raw).trim();
        const problem = fieldProblem(field, value);

        if (problem) {
            if (field.required || value !== null) {
                // A malformed OPTIONAL value is still reported: a mistyped optional
                // certificate path is a silent downgrade, not a non-event.
                missing.push({
                    key: field.key,
                    env: field.env,
                    description: field.description,
                    obtained_from: field.obtained_from || null,
                    problem,
                });
            }
            continue;
        }
        if (value !== null) {
            config[field.key] = value;
            present.push({ key: field.key, env: field.env, secret: !!field.secret });
        }
    }

    return {
        channel,
        label: spec.label,
        authority: spec.authority,
        enrolment: spec.enrolment,
        message_format: spec.message_format,
        configured: missing.length === 0,
        config,
        missing,
        present,
    };
}

/** Resolve, or throw a GatewayNotConfiguredError naming every missing setting. */
function assertConfigured(channel, opts = {}) {
    const result = resolve(channel, opts);
    if (!result.configured) throw new GatewayNotConfiguredError(channel, result.missing);
    return result.config;
}

/**
 * Readiness across every channel — what an integration checklist and an ops
 * endpoint both read. Secrets are never included, only whether they are present.
 */
function readiness({ env = process.env } = {}) {
    const channels = Object.keys(CHANNEL_CONFIG).map((channel) => {
        const r = resolve(channel, { env });
        return {
            channel,
            label: r.label,
            authority: r.authority,
            enrolment: r.enrolment,
            message_format: r.message_format,
            configured: r.configured,
            settings_present: r.present.length,
            settings_required: CHANNEL_CONFIG[channel].fields.filter((f) => f.required).length,
            missing: r.missing.map((m) => ({ env: m.env, description: m.description, obtained_from: m.obtained_from, problem: m.problem })),
        };
    });
    return {
        ready_channels: channels.filter((c) => c.configured).map((c) => c.channel),
        blocked_channels: channels.filter((c) => !c.configured).map((c) => c.channel),
        channels,
        note: 'A channel that is not configured refuses to transmit. There is no simulator fallback — an unconfigured filing path fails loudly rather than returning a fake acknowledgement.',
    };
}

/** The full field catalogue for a channel — the integration checklist. */
function requirements(channel) {
    const spec = CHANNEL_CONFIG[channel];
    if (!spec) return null;
    return {
        channel,
        label: spec.label,
        authority: spec.authority,
        enrolment: spec.enrolment,
        message_format: spec.message_format,
        fields: spec.fields.map((f) => ({
            env: f.env, kind: f.kind, required: !!f.required, secret: !!f.secret,
            description: f.description, obtained_from: f.obtained_from || null,
        })),
    };
}

module.exports = {
    CHANNEL_CONFIG,
    GatewayNotConfiguredError,
    resolve,
    assertConfigured,
    readiness,
    requirements,
    fieldProblem,
};
