CREATE SCHEMA IF NOT EXISTS reporting;

ALTER SCHEMA reporting OWNER TO postgres;

CREATE TABLE reporting.report_jobs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  report_ref varchar(64) NOT NULL,
  report_type varchar(64) NOT NULL,
  format varchar(8) NOT NULL,             -- CSV, JSON, XLSX
  status varchar(16) NOT NULL,            -- PENDING, PROCESSING, COMPLETED, FAILED
  parameters jsonb NOT NULL DEFAULT '{}',
  row_count integer NOT NULL DEFAULT 0,
  content text,
  binary_content boolean NOT NULL DEFAULT false,
  content_type varchar(128),
  file_name varchar(160),
  failure_reason text,
  requested_by varchar(128),
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  completed_at timestamp,
  version bigint,
  CONSTRAINT uk_report_ref UNIQUE (report_ref, tenant_id)
);

CREATE INDEX idx_report_tenant_status_date ON reporting.report_jobs(tenant_id, status, created_at DESC);
CREATE INDEX idx_report_tenant_type ON reporting.report_jobs(tenant_id, report_type);

-- Row-Level Security for multi-tenancy
ALTER TABLE reporting.report_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_jobs_tenant_isolation ON reporting.report_jobs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
