'use strict';
/**
 * Pure request schemas for the document controller. No DB, no I/O — safe to
 * require from tests and from the controller alike (single source of truth).
 */
const { z } = require('zod');

const DOC_TYPES = ['commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin', 'lc', 'inspection_cert'];

const createSchema = z.object({
    order_id: z.string().optional(),
    doc_type: z.enum(DOC_TYPES),
    payload: z.record(z.any()).default({}),
});

// Pagination cap: keep current defaults (page 1, limit 20) but bound limit so the
// list query can never be asked for an unbounded page size.
const MAX_PAGE_SIZE = 100;
const listQuerySchema = z.object({
    orderId: z.string().optional(),
    docType: z.string().optional(),
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
}).passthrough();

// Sign: mirror the existing truthy check (signature required) without tightening it.
const signSchema = z.object({
    signature: z.string().min(1, 'signature required'),
}).passthrough();

module.exports = { DOC_TYPES, MAX_PAGE_SIZE, createSchema, listQuerySchema, signSchema };
