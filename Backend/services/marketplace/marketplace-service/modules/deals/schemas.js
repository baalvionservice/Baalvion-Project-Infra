'use strict';
const { z } = require('zod');

const DEAL_STATUSES = ['open', 'dd', 'negotiating', 'term_sheet', 'signing', 'funding', 'closed', 'withdrawn'];

const createSchema = z.object({
    opportunity_id: z.string().uuid(),
    org_id_company: z.string().uuid(),
    lead_investor_id: z.string().uuid().optional(),
});

const statusSchema = z.object({ status: z.enum(DEAL_STATUSES) });

const messageSchema = z.object({
    body: z.string().min(1).max(5000),
    attachments_json: z.array(z.any()).optional(),
});

const memberSchema = z.object({
    user_id: z.string().min(1),
    org_id: z.string().uuid(),
    role: z.enum(['lead', 'participant', 'advisor', 'legal', 'observer']).default('participant'),
});

const documentRequestSchema = z.object({
    category: z.enum(['financial', 'legal', 'operational', 'compliance', 'tax']),
    title: z.string().min(2).max(300),
});

const documentRequestStatusSchema = z.object({ status: z.enum(['requested', 'uploaded', 'approved', 'rejected']) });

const dataRoomDocSchema = z.object({
    file_url: z.string().min(1).max(600),
    document_request_id: z.string().uuid().optional(),
    version: z.coerce.number().int().optional(),
});

const accessGrantSchema = z.object({
    grantee_org_id: z.string().uuid(),
    category: z.string().max(20).optional(),
    document_id: z.string().uuid().optional(),
    condition: z.enum(['kyc', 'nda', 'verified', 'approved']).default('approved'),
});

const dueDiligenceSchema = z.object({
    category: z.enum(['financial', 'legal', 'operational', 'compliance', 'tax']),
    item: z.string().min(2).max(300),
    owner: z.string().max(120).optional(),
});

const dueDiligenceUpdateSchema = z.object({
    status: z.enum(['open', 'in_progress', 'complete', 'flagged']).optional(),
    evidence_url: z.string().max(600).optional(),
    owner: z.string().max(120).optional(),
});

const termVersionSchema = z.object({
    amount: z.coerce.number().optional(),
    equity_pct: z.coerce.number().optional(),
    valuation: z.coerce.number().optional(),
    board_rights_json: z.record(z.any()).optional(),
    investor_rights_json: z.record(z.any()).optional(),
    exit_rights_json: z.record(z.any()).optional(),
    note: z.string().max(5000).optional(),
});

const termActionSchema = z.object({ action: z.enum(['counter', 'accept', 'reject']) });

// counter/accept/reject in one body — counter carries the (optional) revised terms; for
// accept/reject the term fields are simply ignored.
const termCounterSchema = termVersionSchema.extend({ action: z.enum(['counter', 'accept', 'reject']) });

const signatureSchema = z.object({
    document_type: z.enum(['nda', 'term_sheet', 'spa']),
    provider: z.enum(['aadhaar_esign', 'docusign', 'adobe_sign']).default('docusign'),
});

const escrowSchema = z.object({
    amount: z.coerce.number().positive(),
    currency: z.string().length(3).default('USD'),
    release_conditions_json: z.record(z.any()).optional(),
});

module.exports = {
    DEAL_STATUSES,
    createSchema,
    statusSchema,
    messageSchema,
    memberSchema,
    documentRequestSchema,
    documentRequestStatusSchema,
    dataRoomDocSchema,
    accessGrantSchema,
    dueDiligenceSchema,
    dueDiligenceUpdateSchema,
    termVersionSchema,
    termActionSchema,
    termCounterSchema,
    signatureSchema,
    escrowSchema,
};
