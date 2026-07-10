'use strict';
const { z } = require('zod');

const INCIDENT_TYPES = ['damage', 'loss', 'delay', 'theft', 'customs_hold', 'accident', 'other'];
const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const INCIDENT_STATUSES = ['open', 'investigating', 'resolved', 'closed'];

const createIncidentSchema = z.object({
    shipmentId: z.string().uuid('shipmentId must be a UUID'),
    containerId: z.string().uuid().optional(),
    incidentType: z.enum(INCIDENT_TYPES),
    severity: z.enum(INCIDENT_SEVERITIES).default('medium'),
    description: z.string().min(1, 'description is required'),
    metadata: z.record(z.unknown()).optional(),
});

module.exports = { INCIDENT_TYPES, INCIDENT_SEVERITIES, INCIDENT_STATUSES, createIncidentSchema };
