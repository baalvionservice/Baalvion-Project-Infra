'use strict';
const { z } = require('zod');

const APPOINTMENT_TYPES = ['showroom', 'virtual', 'in_home', 'phone'];
const APPOINTMENT_STATUSES = ['requested', 'confirmed', 'cancelled', 'completed', 'no_show'];

// Book an appointment (guest-capable). preferredAt is an ISO-8601 datetime. The owner (userId or
// guest ownerSessionId) is bound SERVER-SIDE — never accepted from the client.
exports.bookAppointmentSchema = z.object({
    customerName: z.string().min(1).max(200),
    customerEmail: z.string().email().max(254),
    customerPhone: z.string().max(30).optional().nullable(),
    type: z.enum(APPOINTMENT_TYPES).default('showroom'),
    preferredAt: z.string().datetime(),
    location: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
});

// Admin/ops status transition. The forward-only machine lives in the service.
exports.updateAppointmentStatusSchema = z.object({
    status: z.enum(APPOINTMENT_STATUSES),
});

exports.APPOINTMENT_TYPES = APPOINTMENT_TYPES;
exports.APPOINTMENT_STATUSES = APPOINTMENT_STATUSES;
