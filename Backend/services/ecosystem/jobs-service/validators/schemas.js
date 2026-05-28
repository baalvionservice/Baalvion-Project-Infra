const { z } = require('zod');

// Job schemas
const createJobSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    requirements: z.string().optional(),
    location: z.string().max(255).optional(),
    job_type: z.enum(['full_time', 'part_time', 'contract', 'internship']).default('full_time'),
    experience_level: z.enum(['entry', 'mid', 'senior', 'lead']).default('mid'),
    salary_min: z.number().int().positive().optional(),
    salary_max: z.number().int().positive().optional(),
    currency: z.string().max(10).default('INR'),
    remote_allowed: z.boolean().default(false),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    skill_ids: z.array(z.number().int().positive()).optional(),
}).refine(data => {
    if (data.salary_min && data.salary_max) return data.salary_min <= data.salary_max;
    return true;
}, { message: 'salary_min must be <= salary_max' });

const updateJobSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    location: z.string().max(255).optional(),
    job_type: z.enum(['full_time', 'part_time', 'contract', 'internship']).optional(),
    experience_level: z.enum(['entry', 'mid', 'senior', 'lead']).optional(),
    salary_min: z.number().int().positive().optional(),
    salary_max: z.number().int().positive().optional(),
    currency: z.string().max(10).optional(),
    remote_allowed: z.boolean().optional(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    skill_ids: z.array(z.number().int().positive()).optional(),
});

// Application schemas
const createApplicationSchema = z.object({
    job_id: z.number().int().positive(),
    candidate_id: z.number().int().positive().optional(),
    // If no candidate_id, create inline
    email: z.string().email().optional(),
    full_name: z.string().max(255).optional(),
    phone: z.string().max(30).optional(),
    cover_letter: z.string().optional(),
    resume_url: z.string().url().optional(),
    expected_salary: z.number().int().positive().optional(),
    current_salary: z.number().int().positive().optional(),
    notice_period_days: z.number().int().min(0).optional(),
    source: z.string().max(100).optional(),
}).refine(data => data.candidate_id || data.email, {
    message: 'Either candidate_id or email is required',
});

const updateApplicationSchema = z.object({
    status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']).optional(),
    rejection_reason: z.string().optional(),
    offered_salary: z.number().int().positive().optional(),
    offer_accepted_at: z.string().datetime().optional(),
    hired_at: z.string().datetime().optional(),
});

// Candidate schemas
const createCandidateSchema = z.object({
    email: z.string().email(),
    full_name: z.string().max(255).optional(),
    phone: z.string().max(30).optional(),
    resume_url: z.string().url().optional(),
    linkedin_url: z.string().url().optional(),
    portfolio_url: z.string().url().optional(),
    source: z.enum(['referral', 'linkedin', 'job_board', 'direct']).optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).default([]),
});

const updateCandidateSchema = z.object({
    email: z.string().email().optional(),
    full_name: z.string().max(255).optional(),
    phone: z.string().max(30).optional(),
    resume_url: z.string().url().optional(),
    linkedin_url: z.string().url().optional(),
    portfolio_url: z.string().url().optional(),
    status: z.enum(['active', 'inactive', 'blacklisted']).optional(),
    source: z.enum(['referral', 'linkedin', 'job_board', 'direct']).optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

// Interview schemas
const createInterviewSchema = z.object({
    application_id: z.number().int().positive(),
    interviewer_id: z.number().int().positive(),
    scheduled_at: z.string().datetime(),
    duration_minutes: z.number().int().positive().default(60),
    type: z.enum(['video', 'phone', 'in_person', 'technical']).default('video'),
    location: z.string().optional(),
});

const updateInterviewSchema = z.object({
    scheduled_at: z.string().datetime().optional(),
    duration_minutes: z.number().int().positive().optional(),
    type: z.enum(['video', 'phone', 'in_person', 'technical']).optional(),
    location: z.string().optional(),
    status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
});

const interviewFeedbackSchema = z.object({
    feedback: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    recommendation: z.enum(['strong_yes', 'yes', 'neutral', 'no', 'strong_no']),
});

// Pagination
const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
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
};
