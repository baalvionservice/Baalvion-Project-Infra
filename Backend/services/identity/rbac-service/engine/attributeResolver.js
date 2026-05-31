'use strict';
/**
 * Builds the flat attribute CONTEXT consumed by conditionEvaluator. Pure: it does
 * no I/O — the decision service fetches the pieces (roles, stored attributes) and
 * passes them in. Request-supplied attributes win over stored ones.
 */

/**
 * @param {object} input
 * @param {object} input.subject      { id, roles?:string[], level?:number, orgId?, attributes? }
 * @param {object} [input.storedAttrs] attributes loaded from rbac.subject_attributes
 * @param {object} [input.resource]   { type, id, attributes? } or flat object
 * @param {string} [input.action]
 * @param {object} [input.context]    arbitrary environment/context attributes
 * @param {object} [input.tenant]     { id, type, attributes? }
 * @returns {object} evaluation context { subject, resource, action, env, tenant }
 */
function buildContext(input = {}) {
    const { subject = {}, storedAttrs = {}, resource = {}, action, context = {}, tenant = {} } = input;

    const STRUCTURED = ['id', 'roles', 'level', 'orgId', 'scopes', 'attributes'];
    const subjectCtx = {
        id:     subject.id ?? null,
        roles:  Array.isArray(subject.roles) ? subject.roles : [],
        level:  Number.isFinite(subject.level) ? subject.level : 0,
        orgId:  subject.orgId ?? null,
        scopes: subject.scopes || [],
        ...storedAttrs,
        // Arbitrary top-level subject fields (e.g. region, department) are attributes too.
        ...Object.fromEntries(Object.entries(subject).filter(([k]) => !STRUCTURED.includes(k))),
        ...(subject.attributes || {}),
    };

    const resourceCtx = {
        type: resource.type ?? null,
        id:   resource.id ?? null,
        ...(resource.attributes || {}),
        // Allow flat resource fields too (anything not type/id/attributes).
        ...Object.fromEntries(Object.entries(resource).filter(([k]) => !['type', 'id', 'attributes'].includes(k))),
    };

    const now = context.time ? new Date(context.time) : new Date();
    const env = {
        time:      now.toISOString(),
        hour:      now.getUTCHours(),
        dayOfWeek: now.getUTCDay(),
        ...context,
    };

    const tenantCtx = {
        id:   tenant.id ?? null,
        type: tenant.type ?? null,
        ...(tenant.attributes || {}),
    };

    return { subject: subjectCtx, resource: resourceCtx, action: action ?? null, env, tenant: tenantCtx };
}

module.exports = { buildContext };
