'use strict';
/**
 * Logistics Core Foundation (Phase 4) — OpenAPI/Swagger setup. No OpenAPI
 * tooling existed anywhere in trade-service before this; scope is the new
 * logistics routes (routes/*.js JSDoc `@openapi` blocks) rather than
 * retrofitting the ~60 pre-existing routes in one pass.
 *
 * DEGRADES GRACEFULLY: swagger-jsdoc/swagger-ui-express were added to
 * package.json in this same change but aren't installed yet in this
 * environment (same `pnpm install` caveat as @baalvion/events/@baalvion/search
 * — see service/events/logisticsEvents.js). `mountSwagger` no-ops (serves a
 * plain-text explainer instead of a 500) until the install has run.
 */
const path = require('path');
const config = require('./appConfig');
const logger = require('../service/logger');

function buildSpec() {
    // eslint-disable-next-line global-require
    const swaggerJsdoc = require('swagger-jsdoc');
    return swaggerJsdoc({
        definition: {
            openapi: '3.0.3',
            info: {
                title: 'Baalvion Global Trade Infrastructure — Logistics Core',
                version: config.apiVersion,
                description: 'Logistics Core Foundation: shipments, containers, packages, addresses, tracking, warehouses, fleet, cost ledger, incidents, and returns.',
            },
            servers: [{ url: `/${config.apiVersion}`, description: 'Current deployment' }],
            components: {
                securitySchemes: {
                    gatewayAuth: {
                        type: 'apiKey', in: 'header', name: 'x-user-id',
                        description: 'Requests are authenticated via the auth-gateway BFF bridge (see middleware/authMiddleware.js), not a directly-presented bearer token.',
                    },
                },
                schemas: {
                    ApiError: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            error: {
                                type: 'object',
                                properties: {
                                    code: { type: 'string' },
                                    message: { type: 'string' },
                                    details: { type: 'object' },
                                    requestId: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
            security: [{ gatewayAuth: [] }],
            tags: [
                { name: 'Containers' }, { name: 'Packages' }, { name: 'Addresses' }, { name: 'Tracking' },
                { name: 'Warehouses' }, { name: 'Inventory Movements' }, { name: 'Vehicles' }, { name: 'Drivers' },
                { name: 'Fleet Assignments' }, { name: 'Shipment Charges' }, { name: 'Incidents' }, { name: 'Returns' },
            ],
        },
        apis: [path.join(__dirname, '..', 'routes', '*.js')],
    });
}

/** Mount /docs (Swagger UI) and /docs.json (raw spec) on `app`. Never throws. */
function mountSwagger(app) {
    try {
        // eslint-disable-next-line global-require
        const swaggerUi = require('swagger-ui-express');
        const spec = buildSpec();
        app.get('/docs.json', (req, res) => res.json(spec));
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
        logger.info('Swagger UI mounted at /docs');
    } catch (err) {
        logger.warn('swagger-jsdoc/swagger-ui-express not installed — /docs is a no-op until `pnpm install` runs', { error: err.message });
        app.get('/docs', (req, res) => res.status(503).json({
            success: false,
            error: { code: 'DOCS_UNAVAILABLE', message: 'API docs are not built yet — run `pnpm install` for trade-service.' },
        }));
    }
}

module.exports = { mountSwagger };
