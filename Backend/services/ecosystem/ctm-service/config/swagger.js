'use strict';
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title:       'Baalvion CTM Service API',
            version:     '1.0.0',
            description: 'REST API for ControlTheMarket — companies, tasks, submissions, evaluations, badges, and analytics.',
            contact:     { name: 'Baalvion Engineering', email: 'infra.baalvion@gmail.com' },
        },
        servers: [
            { url: 'http://localhost:3017/api/v1', description: 'Development' },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type:         'http',
                    scheme:       'bearer',
                    bearerFormat: 'JWT',
                    description:  'HS256 JWT issued by proxy backend (port 4000)',
                },
            },
        },
        security: [{ BearerAuth: [] }],
        tags: [
            { name: 'Companies',    description: 'Company management' },
            { name: 'Tasks',        description: 'Task / challenge management' },
            { name: 'Submissions',  description: 'Candidate submission management' },
            { name: 'Evaluations',  description: 'Submission evaluation' },
            { name: 'Badges',       description: 'Badge catalog and user badges' },
            { name: 'Teams',        description: 'Company team management' },
            { name: 'Plans',        description: 'Subscription plan catalog' },
            { name: 'Subscriptions',description: 'Company subscriptions' },
            { name: 'Activities',   description: 'Activity log' },
            { name: 'Analytics',    description: 'Platform analytics' },
        ],
    },
    apis: ['./routes/*.js', './controller/*.js'],
};

let swaggerSpec;
try {
    swaggerSpec = swaggerJsdoc(options);
} catch (err) {
    // swagger-jsdoc can throw on a yaml v1/v2 mismatch (keepCstNodes) while
    // parsing @swagger JSDoc blocks. Docs are non-essential — degrade gracefully
    // so the service still boots.
    console.warn('[swagger] spec build failed, serving minimal spec:', err.message);
    swaggerSpec = { openapi: '3.0.0', info: (options.definition && options.definition.info) || { title: 'API', version: '1.0.0' }, paths: {} };
}

module.exports = swaggerSpec;
