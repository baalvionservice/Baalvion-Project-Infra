'use strict';
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title:       'Baalvion TalentOS — Jobs Service API',
            version:     '1.0.0',
            description: 'REST API for job listings, applications, candidates, interviews, and hiring analytics.',
            contact:     { name: 'Baalvion Engineering', email: 'infra.baalvion@gmail.com' },
        },
        servers: [
            { url: 'http://localhost:3002/api/v1', description: 'Development' },
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
            schemas: {
                JobListing: {
                    type: 'object',
                    properties: {
                        id:               { type: 'integer' },
                        org_id:           { type: 'string', format: 'uuid' },
                        title:            { type: 'string' },
                        description:      { type: 'string' },
                        requirements:     { type: 'string' },
                        location:         { type: 'string' },
                        job_type:         { type: 'string', enum: ['full_time','part_time','contract','internship'] },
                        experience_level: { type: 'string', enum: ['entry','mid','senior','lead'] },
                        salary_min:       { type: 'integer' },
                        salary_max:       { type: 'integer' },
                        currency:         { type: 'string', default: 'INR' },
                        status:           { type: 'string', enum: ['draft','published','closed','archived'] },
                        remote_allowed:   { type: 'boolean' },
                        deadline:         { type: 'string', format: 'date' },
                        published_at:     { type: 'string', format: 'date-time' },
                        skills:           { type: 'array', items: { type: 'object' } },
                        created_at:       { type: 'string', format: 'date-time' },
                    },
                },
                Application: {
                    type: 'object',
                    properties: {
                        id:              { type: 'integer' },
                        job_id:          { type: 'integer' },
                        candidate_id:    { type: 'integer' },
                        org_id:          { type: 'string', format: 'uuid' },
                        status:          { type: 'string', enum: ['applied','screening','interview','offer','hired','rejected','withdrawn'] },
                        resume_url:      { type: 'string' },
                        cover_letter:    { type: 'string' },
                        score:           { type: 'integer', minimum: 0, maximum: 100 },
                        score_breakdown: { type: 'object' },
                        created_at:      { type: 'string', format: 'date-time' },
                    },
                },
                Candidate: {
                    type: 'object',
                    properties: {
                        id:                  { type: 'integer' },
                        email:               { type: 'string', format: 'email' },
                        full_name:           { type: 'string' },
                        phone:               { type: 'string' },
                        headline:            { type: 'string' },
                        location:            { type: 'string' },
                        years_of_experience: { type: 'number' },
                        skills:              { type: 'array', items: { type: 'string' } },
                        resume_url:          { type: 'string' },
                    },
                },
                Interview: {
                    type: 'object',
                    properties: {
                        id:             { type: 'integer' },
                        application_id: { type: 'integer' },
                        interview_type: { type: 'string', enum: ['phone','video','onsite','technical','hr'] },
                        scheduled_at:   { type: 'string', format: 'date-time' },
                        meeting_url:    { type: 'string' },
                        status:         { type: 'string', enum: ['scheduled','completed','cancelled','no_show'] },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code:    { type: 'string' },
                                message: { type: 'string' },
                            },
                        },
                    },
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        items:      { type: 'array', items: {} },
                        pagination: {
                            type: 'object',
                            properties: {
                                total:      { type: 'integer' },
                                page:       { type: 'integer' },
                                limit:      { type: 'integer' },
                                totalPages: { type: 'integer' },
                            },
                        },
                    },
                },
            },
        },
        security: [{ BearerAuth: [] }],
        tags: [
            { name: 'Jobs',         description: 'Job listing management' },
            { name: 'Applications', description: 'Job application management' },
            { name: 'Candidates',   description: 'Candidate database management' },
            { name: 'Interviews',   description: 'Interview scheduling and feedback' },
            { name: 'Search',       description: 'Elasticsearch-backed job search' },
            { name: 'Uploads',      description: 'File upload (presigned S3 URLs)' },
            { name: 'Analytics',    description: 'Hiring funnel analytics' },
            { name: 'Skills',       description: 'Skill taxonomy' },
        ],
    },
    apis: ['./routes/*.js', './controller/*.js'],
};

module.exports = swaggerJsdoc(options);
