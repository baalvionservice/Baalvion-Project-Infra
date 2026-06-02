'use strict';
const { z } = require('zod');

const scopeType = z.enum(['platform', 'country', 'organization']);
const effect = z.enum(['allow', 'deny']);
const jsonObj = z.record(z.any());

const schemas = {
    createTenant: z.object({
        type: z.enum(['country', 'organization']),
        parentId: z.string().uuid().optional(),
        externalRef: z.string().max(128).optional(),
        name: z.string().min(1).max(255),
        slug: z.string().max(160).optional(),
        attributes: jsonObj.optional(),
        metadata: jsonObj.optional(),
    }),

    createRole: z.object({
        tenantId: z.string().uuid(),
        key: z.string().max(64).optional(),
        name: z.string().min(1).max(128),
        description: z.string().max(2000).optional(),
        scopeType: scopeType.optional(),
        level: z.number().int().min(0).max(1000).optional(),
        parentRoleId: z.string().uuid().optional(),
        isAssignable: z.boolean().optional(),
        attributes: jsonObj.optional(),
    }),

    updateRole: z.object({
        name: z.string().min(1).max(128).optional(),
        description: z.string().max(2000).optional(),
        level: z.number().int().min(0).max(1000).optional(),
        isAssignable: z.boolean().optional(),
        attributes: jsonObj.optional(),
        status: z.enum(['active', 'inactive']).optional(),
    }).refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' }),

    setParent: z.object({ parentRoleId: z.string().uuid().nullable() }),

    createPermission: z.object({
        key: z.string().max(160).optional(),
        resource: z.string().min(1).max(120),
        action: z.string().min(1).max(60),
        description: z.string().max(2000).optional(),
        module: z.string().max(60).optional(),
        isSystem: z.boolean().optional(),
        attributes: jsonObj.optional(),
    }),

    attachPermission: z.object({
        permissionId: z.string().uuid(),
        effect: effect.optional(),
        constraints: jsonObj.optional(),
    }),

    assignRole: z.object({
        userId: z.string().min(1).max(64),
        roleId: z.string().uuid(),
        scopeId: z.string().max(128).optional(),
        expiresAt: z.string().datetime().optional(),
        attributes: jsonObj.optional(),
    }),

    createPolicy: z.object({
        tenantId: z.string().uuid().optional(),
        key: z.string().max(120).optional(),
        name: z.string().min(1).max(160),
        description: z.string().max(2000).optional(),
        effect: effect.optional(),
        priority: z.number().int().min(0).max(10000).optional(),
        target: jsonObj.optional(),
        condition: jsonObj.optional(),
        obligations: jsonObj.optional(),
        status: z.enum(['active', 'inactive']).optional(),
    }),

    updatePolicy: z.object({
        name: z.string().min(1).max(160).optional(),
        description: z.string().max(2000).optional(),
        effect: effect.optional(),
        priority: z.number().int().min(0).max(10000).optional(),
        target: jsonObj.optional(),
        condition: jsonObj.optional(),
        obligations: jsonObj.optional(),
        status: z.enum(['active', 'inactive']).optional(),
    }).refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' }),

    setSubjectAttribute: z.object({
        tenantId: z.string().uuid().optional(),
        key: z.string().min(1).max(80),
        value: z.any(),
    }),

    authorize: z.object({
        subject: z.object({
            id: z.string().min(1).max(64),
            orgId: z.string().max(128).optional(),
            roles: z.array(z.string()).optional(),
            attributes: jsonObj.optional(),
        }).optional(),
        userId: z.string().max(64).optional(),
        action: z.string().min(1).max(120),
        resource: z.union([
            z.string(),
            z.object({ type: z.string().max(120), id: z.string().max(160).optional(), attributes: jsonObj.optional() }).passthrough(),
        ]),
        scopeId: z.string().max(128).optional(),
        tenantId: z.string().uuid().optional(),
        context: jsonObj.optional(),
    }).refine((o) => o.userId || o.subject?.id, { message: 'subject.id or userId is required' }),
};

/** Express helper: parse req.body with a schema, attaching the result to req.valid. */
const validate = (schemaName) => (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next(new Error(`Unknown schema: ${schemaName}`));
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);
    req.valid = parsed.data;
    next();
};

module.exports = { schemas, validate };
