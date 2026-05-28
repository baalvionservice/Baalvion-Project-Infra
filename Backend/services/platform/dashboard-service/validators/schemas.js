const { z } = require('zod');

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createDashboardSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    is_default: z.boolean().optional(),
    is_public: z.boolean().optional(),
    layout: z.array(z.any()).default([]),
    theme: z.string().max(50).default('light'),
    refresh_interval_seconds: z.number().int().min(0).default(0),
});

const updateDashboardSchema = createDashboardSchema.partial();

const createWidgetSchema = z.object({
    name: z.string().min(1).max(255),
    widget_type: z.enum(['chart', 'table', 'metric', 'text', 'map', 'iframe', 'list']),
    data_source_id: z.number().int().positive().nullable().optional(),
    config: z.record(z.any()).default({}),
    position_x: z.number().int().min(0).default(0),
    position_y: z.number().int().min(0).default(0),
    width: z.number().int().min(1).default(4),
    height: z.number().int().min(1).default(3),
    refresh_interval_seconds: z.number().int().min(0).default(0),
});

const updateWidgetSchema = createWidgetSchema.partial();

const createDataSourceSchema = z.object({
    name: z.string().min(1).max(255),
    source_type: z.enum(['postgres', 'api', 'csv', 'google_sheets', 'bigquery']),
    connection_config: z.record(z.any()).default({}),
    query: z.string().optional(),
    is_active: z.boolean().default(true),
});

const updateDataSourceSchema = createDataSourceSchema.partial();

const pushMetricSchema = z.object({
    metric_name: z.string().min(1).max(255),
    metric_value: z.number().optional(),
    string_value: z.string().optional(),
    unit: z.string().max(50).optional(),
    metadata: z.record(z.any()).default({}),
    captured_at: z.string().datetime().optional(),
});

const metricSnapshotQuerySchema = z.object({
    metric_name: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createScheduledReportSchema = z.object({
    dashboard_id: z.number().int().positive().optional(),
    name: z.string().min(1).max(255),
    schedule_cron: z.string().min(1).max(100),
    format: z.enum(['pdf', 'csv', 'xlsx']).default('pdf'),
    recipients: z.array(z.string()).default([]),
    is_active: z.boolean().default(true),
    next_run_at: z.string().datetime().optional(),
});

const updateScheduledReportSchema = createScheduledReportSchema.partial();

module.exports = {
    paginationSchema,
    createDashboardSchema,
    updateDashboardSchema,
    createWidgetSchema,
    updateWidgetSchema,
    createDataSourceSchema,
    updateDataSourceSchema,
    pushMetricSchema,
    metricSnapshotQuerySchema,
    createScheduledReportSchema,
    updateScheduledReportSchema,
};
