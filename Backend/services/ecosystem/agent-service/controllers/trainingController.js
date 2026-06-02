'use strict';
const { z } = require('zod');
const trainingService = require('../services/trainingService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { orgScope } = require('../middleware/guards');

function parse(schema, body) {
    const r = schema.safeParse(body);
    if (!r.success) throw new AppError('VALIDATION_ERROR', 'Invalid request body', 422, r.error.flatten());
    return r.data;
}

const courseSchema = z.object({
    title: z.string().min(1).max(200), description: z.string().optional(), category: z.string().max(80).optional(),
    required: z.boolean().optional(), passingScore: z.number().int().min(0).max(100).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(), orgId: z.string().max(128).optional(),
}).strip();
const moduleSchema = z.object({
    title: z.string().min(1).max(200), position: z.number().int().optional(),
    contentType: z.enum(['video', 'article', 'quiz']).optional(), contentUrl: z.string().optional(), body: z.string().optional(), metadata: z.record(z.any()).optional(),
}).strip();

exports.createCourse = async (req, res) => sendSuccess(req, res, await trainingService.createCourse(parse(courseSchema, req.body || {}), req.auth), 201);
exports.listCourses  = async (req, res) => sendSuccess(req, res, await trainingService.listCourses(orgScope(req), req.query));
exports.getCourse    = async (req, res) => sendSuccess(req, res, await trainingService.getCourse(req.params.id, orgScope(req), { withModules: true }));
exports.addModule    = async (req, res) => sendSuccess(req, res, await trainingService.addModule(req.params.id, parse(moduleSchema, req.body || {}), orgScope(req)), 201);

exports.enroll         = async (req, res) => sendSuccess(req, res, await trainingService.enroll(req.params.id, parse(z.object({ agentId: z.string().uuid() }), req.body || {}).agentId, orgScope(req)), 201);
exports.completeModule = async (req, res) => { const b = parse(z.object({ agentId: z.string().uuid(), moduleId: z.string().uuid() }), req.body || {}); sendSuccess(req, res, await trainingService.completeModule(req.params.id, b.agentId, b.moduleId)); };
exports.submitScore    = async (req, res) => { const b = parse(z.object({ agentId: z.string().uuid(), score: z.number().min(0).max(100) }), req.body || {}); sendSuccess(req, res, await trainingService.submitScore(req.params.id, b.agentId, b.score)); };
exports.listEnrollments = async (req, res) => sendSuccess(req, res, await trainingService.listEnrollments({ courseId: req.params.id, ...req.query }));
exports.agentCerts     = async (req, res) => sendSuccess(req, res, await trainingService.agentCertifications(req.params.agentId));
