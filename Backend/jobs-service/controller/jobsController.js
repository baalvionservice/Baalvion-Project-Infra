const jobsService = require('../service/jobsService');
const searchService = require('../service/searchService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');
const {
    createJobSchema,
    updateJobSchema,
    createApplicationSchema,
    updateApplicationSchema,
    createCandidateSchema,
    updateCandidateSchema,
    createInterviewSchema,
    updateInterviewSchema,
    interviewFeedbackSchema,
    paginationSchema,
} = require('../validators/schemas');

// ─── Helpers ────────────────────────────────────────────────────────────────

const validate = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const details = result.error.flatten().fieldErrors;
        throw new AppError('VALIDATION_ERROR', 'Validation failed', 422, details);
    }
    return result.data;
};

const getPagination = (query) => {
    const { page, limit } = paginationSchema.parse(query);
    return { page, limit };
};

// ─── Jobs ────────────────────────────────────────────────────────────────────

const listJobs = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, job_type, experience_level, remote_allowed, search } = req.query;
        // Public endpoint — orgId optional
        const orgId = req.auth?.orgId || req.query.org_id || null;
        const result = await jobsService.listJobs({ orgId, status, job_type, experience_level, remote_allowed, search, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getJob = async (req, res, next) => {
    try {
        const job = await jobsService.getJobById(req.params.id);
        // Increment views (fire-and-forget)
        job.increment('views_count').catch(() => {});
        return sendSuccess(req, res, job);
    } catch (err) { return next(err); }
};

const createJob = async (req, res, next) => {
    try {
        const data = validate(createJobSchema, req.body);
        const job = await jobsService.createJob(req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, job, 201);
    } catch (err) { return next(err); }
};

const updateJob = async (req, res, next) => {
    try {
        const data = validate(updateJobSchema, req.body);
        const job = await jobsService.updateJob(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, job);
    } catch (err) { return next(err); }
};

const deleteJob = async (req, res, next) => {
    try {
        const result = await jobsService.deleteJob(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const publishJob = async (req, res, next) => {
    try {
        const job = await jobsService.publishJob(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, job);
    } catch (err) { return next(err); }
};

const closeJob = async (req, res, next) => {
    try {
        const job = await jobsService.closeJob(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, job);
    } catch (err) { return next(err); }
};

const listJobApplications = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const result = await jobsService.listJobApplications(req.params.id, req.auth.orgId, { page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

// ─── Applications ────────────────────────────────────────────────────────────

const listApplications = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, job_id, candidate_id } = req.query;
        const result = await jobsService.listApplications({ orgId: req.auth.orgId, status, job_id, candidate_id, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getApplication = async (req, res, next) => {
    try {
        const app = await jobsService.getApplicationById(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, app);
    } catch (err) { return next(err); }
};

const createApplication = async (req, res, next) => {
    try {
        const data = validate(createApplicationSchema, req.body);
        const app = await jobsService.createApplication(req.auth?.orgId, data);
        return sendSuccess(req, res, app, 201);
    } catch (err) { return next(err); }
};

const updateApplication = async (req, res, next) => {
    try {
        const data = validate(updateApplicationSchema, req.body);
        const app = await jobsService.updateApplication(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, app);
    } catch (err) { return next(err); }
};

const moveApplicationStage = async (req, res, next) => {
    try {
        const { stage } = req.body;
        if (!stage) throw new AppError('VALIDATION_ERROR', 'stage is required', 422);
        const app = await jobsService.moveApplicationStage(req.params.id, req.auth.orgId, stage);
        return sendSuccess(req, res, app);
    } catch (err) { return next(err); }
};

// ─── Candidates ───────────────────────────────────────────────────────────────

const listCandidates = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, source, search } = req.query;
        const result = await jobsService.listCandidates({ orgId: req.auth.orgId, status, source, search, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getCandidate = async (req, res, next) => {
    try {
        const candidate = await jobsService.getCandidateById(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, candidate);
    } catch (err) { return next(err); }
};

const createCandidate = async (req, res, next) => {
    try {
        const data = validate(createCandidateSchema, req.body);
        const candidate = await jobsService.createCandidate(req.auth.orgId, data);
        return sendSuccess(req, res, candidate, 201);
    } catch (err) { return next(err); }
};

const updateCandidate = async (req, res, next) => {
    try {
        const data = validate(updateCandidateSchema, req.body);
        const candidate = await jobsService.updateCandidate(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, candidate);
    } catch (err) { return next(err); }
};

// ─── Interviews ───────────────────────────────────────────────────────────────

const listInterviews = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, application_id, interviewer_id } = req.query;
        const result = await jobsService.listInterviews({ orgId: req.auth.orgId, status, application_id, interviewer_id, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getInterview = async (req, res, next) => {
    try {
        const interview = await jobsService.getInterviewById(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, interview);
    } catch (err) { return next(err); }
};

const scheduleInterview = async (req, res, next) => {
    try {
        const data = validate(createInterviewSchema, req.body);
        const interview = await jobsService.scheduleInterview(req.auth.orgId, data);
        return sendSuccess(req, res, interview, 201);
    } catch (err) { return next(err); }
};

const updateInterview = async (req, res, next) => {
    try {
        const data = validate(updateInterviewSchema, req.body);
        const interview = await jobsService.updateInterview(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, interview);
    } catch (err) { return next(err); }
};

const cancelInterview = async (req, res, next) => {
    try {
        const interview = await jobsService.cancelInterview(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, interview);
    } catch (err) { return next(err); }
};

const submitFeedback = async (req, res, next) => {
    try {
        const data = validate(interviewFeedbackSchema, req.body);
        const interview = await jobsService.submitInterviewFeedback(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, interview);
    } catch (err) { return next(err); }
};

// ─── Analytics ───────────────────────────────────────────────────────────────

const getHiringAnalytics = async (req, res, next) => {
    try {
        const data = await jobsService.getHiringAnalytics(req.auth.orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

// ─── Skills ───────────────────────────────────────────────────────────────────

const listSkills = async (req, res, next) => {
    try {
        const { category, search } = req.query;
        const skills = await jobsService.listSkills({ category, search });
        return sendSuccess(req, res, skills);
    } catch (err) { return next(err); }
};

// ─── Search ──────────────────────────────────────────────────────────────────

const searchJobs = async (req, res, next) => {
    try {
        const result = await searchService.searchJobs(req.query);
        return res.json({ success: true, ...result });
    } catch (err) { return next(err); }
};

const reindexJobs = async (req, res, next) => {
    try {
        const result = await searchService.reindexAll();
        return sendSuccess(res, result);
    } catch (err) { return next(err); }
};

// ─── Upload handlers ─────────────────────────────────────────────────────────

const uploadService = require('../service/uploadService');
const multer = require('multer');
const multerMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const presignUpload = async (req, res, next) => {
    try {
        const { folder = 'resumes', filename, contentType, fileSizeBytes } = req.body;
        if (!filename || !contentType) throw new AppError('VALIDATION_ERROR', 'filename and contentType required', 422);
        const result = await uploadService.getPresignedUploadUrl({ folder, filename, contentType, fileSizeBytes });
        return sendSuccess(res, result);
    } catch (err) { return next(err); }
};

const uploadResume = [
    multerMemory.single('file'),
    async (req, res, next) => {
        try {
            if (!req.file) throw new AppError('VALIDATION_ERROR', 'No file uploaded', 422);
            const { key, publicUrl } = await uploadService.uploadBuffer({
                folder: 'resumes',
                filename: req.file.originalname,
                contentType: req.file.mimetype,
                buffer: req.file.buffer,
            });
            return sendSuccess(res, { url: publicUrl, key }, 201);
        } catch (err) { return next(err); }
    },
];

module.exports = {
    listJobs, getJob, createJob, updateJob, deleteJob, publishJob, closeJob, listJobApplications,
    listApplications, getApplication, createApplication, updateApplication, moveApplicationStage,
    listCandidates, getCandidate, createCandidate, updateCandidate,
    listInterviews, getInterview, scheduleInterview, updateInterview, cancelInterview, submitFeedback,
    getHiringAnalytics,
    listSkills,
    presignUpload, uploadResume,
    searchJobs, reindexJobs,
};
