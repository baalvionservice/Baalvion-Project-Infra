'use strict';
/**
 * OpenAPI 3.0 contract for the Unified Analytics endpoints. Served as JSON at
 * GET /api/v1/analytics/openapi.json (no swagger-ui dependency added). Kept in
 * sync with routes/analyticsRoutes.js + routes/collectRoutes.js.
 */
const range = {
    type: 'object',
    properties: { from: { type: 'string', example: '2026-06-04' }, to: { type: 'string', example: '2026-07-03' } },
};

module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'Baalvion Unified Analytics API',
        version: '1.0.0',
        description: 'Multi-tenant analytics for every CMS-managed website. Reporting endpoints are website-scoped and RBAC-gated; the collector is a public first-party beacon.',
    },
    servers: [{ url: '/api/v1' }],
    tags: [{ name: 'collect' }, { name: 'reporting' }, { name: 'providers' }],
    paths: {
        '/collect': {
            post: {
                tags: ['collect'],
                summary: 'First-party event beacon (public, per-site origin allowlisted)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['site', 'events'],
                                properties: {
                                    site: { type: 'string', description: 'website slug or UUID' },
                                    events: {
                                        type: 'array', minItems: 1, maxItems: 100,
                                        items: {
                                            type: 'object', required: ['event'],
                                            properties: {
                                                event: { type: 'string', example: 'page_view' },
                                                module: { type: 'string' },
                                                page: { type: 'string' }, url: { type: 'string' }, referrer: { type: 'string' },
                                                sessionId: { type: 'string' }, visitorId: { type: 'string' },
                                                occurredAt: { type: 'string', format: 'date-time' },
                                                value: { type: 'number' }, currency: { type: 'string' },
                                                campaign: { type: 'object' }, geo: { type: 'object' },
                                                device: { type: 'object' }, metadata: { type: 'object' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: { 202: { description: 'Accepted (enqueued or dropped silently)' } },
            },
        },
        '/cms/websites/{websiteId}/analytics/overview': {
            get: {
                tags: ['reporting'], summary: 'KPI summary for a module over a date range',
                parameters: [
                    { name: 'websiteId', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'from', in: 'query', schema: { type: 'string' } },
                    { name: 'to', in: 'query', schema: { type: 'string' } },
                    { name: 'module', in: 'query', schema: { type: 'string', default: 'traffic' } },
                ],
                responses: { 200: { description: 'KPI metrics', content: { 'application/json': { schema: { type: 'object', properties: { range, metrics: { type: 'object' } } } } } } },
            },
        },
        '/cms/websites/{websiteId}/analytics/timeseries': {
            get: {
                tags: ['reporting'], summary: 'Daily series of one metric',
                parameters: [
                    { name: 'websiteId', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'metric', in: 'query', schema: { type: 'string', default: 'pageviews' } },
                    { name: 'module', in: 'query', schema: { type: 'string', default: 'traffic' } },
                    { name: 'from', in: 'query', schema: { type: 'string' } }, { name: 'to', in: 'query', schema: { type: 'string' } },
                ],
                responses: { 200: { description: 'series' } },
            },
        },
        '/cms/websites/{websiteId}/analytics/breakdown': {
            get: {
                tags: ['reporting'], summary: 'Top-N breakdown by a dimension',
                parameters: [
                    { name: 'websiteId', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'dimension', in: 'query', required: true, schema: { type: 'string', example: 'country' } },
                    { name: 'metric', in: 'query', schema: { type: 'string', default: 'pageviews' } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                ],
                responses: { 200: { description: 'rows' } },
            },
        },
        '/cms/websites/{websiteId}/analytics/realtime': {
            get: {
                tags: ['reporting'], summary: 'Live counts over the last N minutes',
                parameters: [
                    { name: 'websiteId', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'windowMin', in: 'query', schema: { type: 'integer', default: 5, maximum: 60 } },
                ],
                responses: { 200: { description: 'realtime counts + top pages' } },
            },
        },
        '/cms/websites/{websiteId}/analytics/providers': {
            get: {
                tags: ['providers'], summary: 'Connected providers + the connectable catalog',
                parameters: [{ name: 'websiteId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'providers' } },
            },
        },
        '/cms/websites/{websiteId}/analytics/providers/{provider}/sync': {
            post: {
                tags: ['providers'], summary: 'Enqueue a provider sync (cms_admin)',
                parameters: [
                    { name: 'websiteId', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'provider', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: { 202: { description: 'sync enqueued' }, 501: { description: 'connector not implemented yet' } },
            },
        },
    },
};
