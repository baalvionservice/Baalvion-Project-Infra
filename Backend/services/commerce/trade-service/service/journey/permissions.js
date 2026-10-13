'use strict';
/**
 * Roles, permissions and document scopes for the parties to an order.
 *
 * This is the rulebook, kept as plain data and pure functions so it can be read, reviewed and
 * tested without a database. The two rules that protect a customer's commercial position are
 * ALSO enforced by constraints in migration 089, so a bug here cannot turn them off:
 *   - a freight forwarder or customs broker never holds commercial.view or payment.view;
 *   - an unknown permission cannot be stored.
 *
 * Nothing here knows about a country or a corridor. India <-> UAE is the first pilot, not a
 * property of the model.
 */
const { AppError } = require('../../utils/errors');

const ROLES = Object.freeze(['buyer', 'seller', 'freight_forwarder', 'customs_broker', 'bank', 'insurer', 'trade_agent']);
const SERVICE_PROVIDER_ROLES = Object.freeze(['freight_forwarder', 'customs_broker']);

const PERMISSIONS = Object.freeze([
    'journey.view', 'journey.manage', 'parties.manage',
    'logistics.view', 'logistics.manage',
    'customs.view', 'customs.manage', 'customs_value.view',
    'documents.view', 'documents.manage',
    'tracking.view',
    'commercial.view', 'payment.view',
]);

/** Prices, margins and payment terms. Never available to a service provider. */
const COMMERCIAL_PERMISSIONS = Object.freeze(['commercial.view', 'payment.view']);

const BUYER_SELLER_BASE = ['journey.view', 'journey.manage', 'parties.manage', 'logistics.view', 'customs.view', 'customs_value.view', 'documents.view', 'documents.manage', 'tracking.view', 'commercial.view', 'payment.view'];

/** What each role gets when no grants are specified. */
const DEFAULT_PERMISSIONS = Object.freeze({
    buyer: BUYER_SELLER_BASE,
    seller: [...BUYER_SELLER_BASE, 'logistics.manage', 'customs.manage'],
    freight_forwarder: ['journey.view', 'logistics.view', 'logistics.manage', 'customs.view', 'documents.view', 'tracking.view'],
    // A broker needs the declared customs value to file, but that is a separate, explicit grant: the
    // default is that a broker does not see value at all.
    customs_broker: ['journey.view', 'customs.view', 'customs.manage', 'logistics.view', 'documents.view', 'tracking.view'],
    bank: ['journey.view', 'payment.view', 'documents.view', 'tracking.view'],
    insurer: ['journey.view', 'logistics.view', 'documents.view', 'tracking.view'],
    trade_agent: ['journey.view', 'tracking.view'],
});

/** The most an owner may grant each role. Buyer and seller are fixed. */
const GRANTABLE = Object.freeze({
    freight_forwarder: [...DEFAULT_PERMISSIONS.freight_forwarder, 'customs.manage', 'customs_value.view', 'documents.manage'],
    customs_broker: [...DEFAULT_PERMISSIONS.customs_broker, 'customs_value.view', 'documents.manage'],
    bank: [...DEFAULT_PERMISSIONS.bank, 'commercial.view'],
    insurer: [...DEFAULT_PERMISSIONS.insurer, 'customs_value.view'],
    trade_agent: [...DEFAULT_PERMISSIONS.trade_agent, 'logistics.view', 'customs.view', 'documents.view', 'commercial.view'],
});

const DOCUMENT_SCOPES = Object.freeze([
    'bill_of_lading', 'packing_list', 'booking_confirmation', 'delivery_order', 'certificate_of_origin',
    'commercial_invoice', 'proforma_invoice', 'letter_of_credit', 'insurance_certificate', 'customs_declaration', 'inspection_report',
]);

/** Documents that show a price. A party may hold one only with an explicit value permission. */
const PRICE_BEARING_DOCUMENTS = Object.freeze(['commercial_invoice', 'proforma_invoice', 'letter_of_credit']);

const DEFAULT_DOCUMENT_SCOPES = Object.freeze({
    buyer: DOCUMENT_SCOPES,
    seller: DOCUMENT_SCOPES,
    freight_forwarder: ['bill_of_lading', 'packing_list', 'booking_confirmation', 'delivery_order'],
    customs_broker: ['packing_list', 'bill_of_lading', 'certificate_of_origin', 'customs_declaration'],
    bank: ['commercial_invoice', 'bill_of_lading', 'letter_of_credit'],
    insurer: ['packing_list', 'bill_of_lading', 'insurance_certificate'],
    trade_agent: [],
});

/**
 * Which kinds of organisation may take which role. A customs broker is a private licensed agent, which
 * is not the same thing as a customs authority; until the platform has a dedicated "customs broker"
 * organisation type, a logistics provider or a trade agent can hold the role.
 */
const ALLOWED_ORG_TYPES = Object.freeze({
    buyer: ['buyer'],
    seller: ['seller'],
    freight_forwarder: ['logistics_provider'],
    customs_broker: ['customs_broker', 'logistics_provider', 'trade_agent'],
    bank: ['bank'],
    insurer: ['insurance_provider'],
    trade_agent: ['trade_agent'],
});

const unique = (a) => [...new Set(a)];
const invalid = (message) => new AppError('VALIDATION_ERROR', message, 422);

/**
 * Turn a request for a role (and optionally specific permissions and document scopes) into the exact
 * grant that will be stored, or refuse it with a plain explanation.
 */
function resolveGrant(role, { permissions, documentScopes } = {}) {
    if (!ROLES.includes(role)) throw invalid(`"${role}" is not a role on an order. Choose one of: ${ROLES.join(', ')}.`);

    let perms = permissions == null ? [...DEFAULT_PERMISSIONS[role]] : unique(permissions);
    if (permissions != null) {
        const unknown = perms.filter((p) => !PERMISSIONS.includes(p));
        if (unknown.length) throw invalid(`Unknown permission: ${unknown.join(', ')}.`);
        if (role === 'buyer' || role === 'seller') throw invalid('The buyer and the seller always have the standard permissions; they cannot be changed.');
        const allowed = GRANTABLE[role] || [];
        const tooMuch = perms.filter((p) => !allowed.includes(p));
        if (tooMuch.length) throw invalid(`A ${role.replace('_', ' ')} cannot be given: ${tooMuch.join(', ')}.`);
    }
    if (SERVICE_PROVIDER_ROLES.includes(role)) {
        const commercial = perms.filter((p) => COMMERCIAL_PERMISSIONS.includes(p));
        if (commercial.length) throw invalid(`A ${role.replace('_', ' ')} can never see prices or payment details (${commercial.join(', ')}).`);
    }
    if (!perms.includes('journey.view')) perms = ['journey.view', ...perms];

    const scopes = documentScopes == null ? [...DEFAULT_DOCUMENT_SCOPES[role]] : unique(documentScopes);
    const badScope = scopes.filter((s) => !DOCUMENT_SCOPES.includes(s));
    if (badScope.length) throw invalid(`Unknown document type: ${badScope.join(', ')}.`);
    // A bank handles the money, so payment.view is its value permission; a forwarder or broker cannot
    // hold payment.view at all (checked above), so this never opens a price document to one.
    const seesValue = perms.includes('commercial.view') || perms.includes('customs_value.view') || perms.includes('payment.view');
    const needsValue = scopes.filter((s) => PRICE_BEARING_DOCUMENTS.includes(s));
    if (needsValue.length && !seesValue && role !== 'buyer' && role !== 'seller') {
        throw invalid(`${needsValue.join(', ')} show${needsValue.length === 1 ? 's' : ''} a price, so access needs an explicit value permission (customs_value.view or commercial.view).`);
    }
    return { permissions: perms.sort(), documentScopes: scopes.sort() };
}

function assertOrgTypeAllowed(role, orgType) {
    const allowed = ALLOWED_ORG_TYPES[role] || [];
    if (!allowed.includes(String(orgType))) {
        throw invalid(`An organisation of type "${orgType}" cannot act as a ${role.replace('_', ' ')}. It needs to be: ${allowed.join(' or ')}.`);
    }
}

module.exports = {
    ROLES, SERVICE_PROVIDER_ROLES, PERMISSIONS, COMMERCIAL_PERMISSIONS, DEFAULT_PERMISSIONS, GRANTABLE,
    DOCUMENT_SCOPES, PRICE_BEARING_DOCUMENTS, DEFAULT_DOCUMENT_SCOPES, ALLOWED_ORG_TYPES,
    resolveGrant, assertOrgTypeAllowed,
};
