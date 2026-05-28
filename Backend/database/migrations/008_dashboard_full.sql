-- Migration 008: Dashboard Service — full company management schema
-- Run once against baalvion_db after migration 007

CREATE SCHEMA IF NOT EXISTS dashboard;

-- ─── Domains (Businesses / Subsidiaries) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.domains (
    id           SERIAL PRIMARY KEY,
    org_id       UUID,
    name         VARCHAR(200) NOT NULL,
    type         VARCHAR(100),
    description  TEXT,
    country      VARCHAR(100),
    country_code VARCHAR(10),
    currency     VARCHAR(10) DEFAULT 'USD' CHECK (currency IN ('USD','INR','GBP','AED','SGD')),
    status       VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active','Growth','Review')),
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_domains_org ON dashboard.domains (org_id);

-- ─── Financial Entries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.financial_entries (
    id          SERIAL PRIMARY KEY,
    org_id      UUID,
    domain_id   INTEGER REFERENCES dashboard.domains(id) ON DELETE SET NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('Revenue','Expense')),
    amount      DECIMAL(15,2) NOT NULL DEFAULT 0,
    date        DATE         NOT NULL,
    description TEXT,
    category    VARCHAR(100),
    created_at  TIMESTAMPTZ  DEFAULT now(),
    updated_at  TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_fin_org       ON dashboard.financial_entries (org_id);
CREATE INDEX IF NOT EXISTS idx_dash_fin_domain    ON dashboard.financial_entries (domain_id);
CREATE INDEX IF NOT EXISTS idx_dash_fin_type_date ON dashboard.financial_entries (type, date);

-- ─── Shareholders ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.shareholders (
    id                SERIAL PRIMARY KEY,
    org_id            UUID,
    name              VARCHAR(200) NOT NULL,
    role              VARCHAR(50)  NOT NULL CHECK (role IN ('Founder','CEO','Investor','Co-Founder')),
    equity_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (equity_percentage >= 0 AND equity_percentage <= 100),
    created_at        TIMESTAMPTZ  DEFAULT now(),
    updated_at        TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_shareholders_org ON dashboard.shareholders (org_id);

-- ─── Equity History ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.equity_history (
    id               SERIAL PRIMARY KEY,
    org_id           UUID,
    shareholder_id   INTEGER NOT NULL REFERENCES dashboard.shareholders(id) ON DELETE CASCADE,
    old_percentage   DECIMAL(5,2),
    new_percentage   DECIMAL(5,2),
    reason           TEXT,
    changed_by       INTEGER,
    created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_equity_hist_sh ON dashboard.equity_history (shareholder_id);

-- ─── Distribution History ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.distribution_history (
    id                    SERIAL PRIMARY KEY,
    org_id                UUID,
    total_profit          DECIMAL(15,2) NOT NULL,
    retention_percentage  DECIMAL(5,2)  NOT NULL,
    retained_amount       DECIMAL(15,2) NOT NULL,
    distributed_amount    DECIMAL(15,2) NOT NULL,
    date                  DATE          NOT NULL,
    payouts               JSONB         DEFAULT '[]',
    created_at            TIMESTAMPTZ   DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_dist_org  ON dashboard.distribution_history (org_id);
CREATE INDEX IF NOT EXISTS idx_dash_dist_date ON dashboard.distribution_history (date DESC);

-- ─── Employees ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.employees (
    id               SERIAL PRIMARY KEY,
    org_id           UUID,
    name             VARCHAR(200) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    role             VARCHAR(100),
    department       VARCHAR(100),
    business_id      INTEGER REFERENCES dashboard.domains(id) ON DELETE SET NULL,
    country          VARCHAR(100),
    status           VARCHAR(30)  DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave')),
    employment_type  VARCHAR(30)  DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contractor')),
    join_date        DATE,
    salary           DECIMAL(12,2) DEFAULT 0,
    manager_id       INTEGER REFERENCES dashboard.employees(id) ON DELETE SET NULL,
    performance_score DECIMAL(3,1) DEFAULT 0,
    tasks_completed  INTEGER      DEFAULT 0,
    attendance_rate  DECIMAL(5,2) DEFAULT 100,
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now(),
    UNIQUE (org_id, email)
);
CREATE INDEX IF NOT EXISTS idx_dash_employees_org        ON dashboard.employees (org_id);
CREATE INDEX IF NOT EXISTS idx_dash_employees_dept       ON dashboard.employees (department);
CREATE INDEX IF NOT EXISTS idx_dash_employees_business   ON dashboard.employees (business_id);

-- ─── Attendance ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.attendance (
    id           SERIAL PRIMARY KEY,
    org_id       UUID,
    employee_id  INTEGER NOT NULL REFERENCES dashboard.employees(id) ON DELETE CASCADE,
    date         DATE    NOT NULL,
    status       VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present','absent','late','on_leave')),
    hours_worked DECIMAL(4,2) DEFAULT 0,
    created_at   TIMESTAMPTZ  DEFAULT now(),
    UNIQUE (employee_id, date)
);
CREATE INDEX IF NOT EXISTS idx_dash_attendance_emp  ON dashboard.attendance (employee_id);
CREATE INDEX IF NOT EXISTS idx_dash_attendance_date ON dashboard.attendance (date DESC);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.tasks (
    id          SERIAL PRIMARY KEY,
    org_id      UUID,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    status      VARCHAR(30)  DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','blocked')),
    assignee_id INTEGER REFERENCES dashboard.employees(id) ON DELETE SET NULL,
    business_id INTEGER REFERENCES dashboard.domains(id) ON DELETE SET NULL,
    priority    VARCHAR(20)  DEFAULT 'Medium' CHECK (priority IN ('High','Medium','Low')),
    due_date    DATE,
    created_at  TIMESTAMPTZ  DEFAULT now(),
    updated_at  TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_tasks_org      ON dashboard.tasks (org_id);
CREATE INDEX IF NOT EXISTS idx_dash_tasks_assignee ON dashboard.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_dash_tasks_status   ON dashboard.tasks (status);

-- ─── Task Comments ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.task_comments (
    id          SERIAL PRIMARY KEY,
    task_id     INTEGER NOT NULL REFERENCES dashboard.tasks(id) ON DELETE CASCADE,
    author_id   INTEGER REFERENCES dashboard.employees(id) ON DELETE SET NULL,
    text        TEXT    NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_task_comments_task ON dashboard.task_comments (task_id);

-- ─── Transactions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.transactions (
    id             SERIAL PRIMARY KEY,
    org_id         UUID,
    business_id    INTEGER REFERENCES dashboard.domains(id) ON DELETE SET NULL,
    gateway        VARCHAR(30) CHECK (gateway IN ('Stripe','Razorpay','PayPal')),
    customer_name  VARCHAR(200),
    customer_email VARCHAR(255),
    amount         DECIMAL(12,2) DEFAULT 0,
    fee            DECIMAL(10,2) DEFAULT 0,
    currency       VARCHAR(10)   DEFAULT 'USD',
    status         VARCHAR(20)   DEFAULT 'Pending' CHECK (status IN ('Success','Failed','Pending')),
    created_at     TIMESTAMPTZ   DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_txn_org      ON dashboard.transactions (org_id);
CREATE INDEX IF NOT EXISTS idx_dash_txn_business ON dashboard.transactions (business_id);
CREATE INDEX IF NOT EXISTS idx_dash_txn_status   ON dashboard.transactions (status);

-- ─── KPIs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.kpis (
    id                SERIAL PRIMARY KEY,
    org_id            UUID,
    business_id       INTEGER REFERENCES dashboard.domains(id) ON DELETE CASCADE,
    revenue_target    DECIMAL(15,2) DEFAULT 0,
    revenue_actual    DECIMAL(15,2) DEFAULT 0,
    profit_margin     DECIMAL(5,2)  DEFAULT 0,
    profit_trend      VARCHAR(10)   DEFAULT 'flat' CHECK (profit_trend IN ('up','down','flat')),
    customers_total   INTEGER       DEFAULT 0,
    customers_change  DECIMAL(5,2)  DEFAULT 0,
    return_rate       DECIMAL(5,2)  DEFAULT 0,
    nps               INTEGER       DEFAULT 0,
    created_at        TIMESTAMPTZ   DEFAULT now(),
    updated_at        TIMESTAMPTZ   DEFAULT now(),
    UNIQUE (org_id, business_id)
);
CREATE INDEX IF NOT EXISTS idx_dash_kpis_org ON dashboard.kpis (org_id);

-- ─── Compliance Records ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.compliance_records (
    id                SERIAL PRIMARY KEY,
    org_id            UUID,
    country_id        VARCHAR(50)  NOT NULL,
    country           VARCHAR(100) NOT NULL,
    business_id       INTEGER REFERENCES dashboard.domains(id) ON DELETE SET NULL,
    tax_status        VARCHAR(100),
    tax_status_code   VARCHAR(20)  DEFAULT 'ok' CHECK (tax_status_code IN ('ok','warning')),
    vat_gst           VARCHAR(200),
    licenses          VARCHAR(200),
    data_laws         VARCHAR(200),
    employment_law    VARCHAR(200),
    overall_score     INTEGER      DEFAULT 100,
    action_items      JSONB        DEFAULT '[]',
    created_at        TIMESTAMPTZ  DEFAULT now(),
    updated_at        TIMESTAMPTZ  DEFAULT now(),
    UNIQUE (org_id, country_id)
);
CREATE INDEX IF NOT EXISTS idx_dash_compliance_org ON dashboard.compliance_records (org_id);

-- ─── Audit Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.audit_logs (
    id           SERIAL PRIMARY KEY,
    org_id       UUID,
    action       VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(100),
    entity_id    VARCHAR(100),
    user_id      INTEGER,
    user_name    VARCHAR(200),
    role         VARCHAR(50),
    resource     VARCHAR(200),
    ip_address   VARCHAR(50),
    location     VARCHAR(100),
    status       VARCHAR(20)  DEFAULT 'Success' CHECK (status IN ('Success','Failed')),
    severity     VARCHAR(20)  DEFAULT 'Info' CHECK (severity IN ('Critical','Warning','Info')),
    details      JSONB        DEFAULT '{}',
    created_at   TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_audit_org      ON dashboard.audit_logs (org_id);
CREATE INDEX IF NOT EXISTS idx_dash_audit_severity ON dashboard.audit_logs (severity);
CREATE INDEX IF NOT EXISTS idx_dash_audit_created  ON dashboard.audit_logs (created_at DESC);

-- ─── Permissions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.permissions (
    id         SERIAL PRIMARY KEY,
    org_id     UUID,
    user_id    INTEGER NOT NULL,
    module     VARCHAR(100) NOT NULL,
    access     VARCHAR(20)  DEFAULT 'read' CHECK (access IN ('read','write','admin')),
    created_at TIMESTAMPTZ  DEFAULT now(),
    updated_at TIMESTAMPTZ  DEFAULT now(),
    UNIQUE (org_id, user_id, module)
);
CREATE INDEX IF NOT EXISTS idx_dash_permissions_user ON dashboard.permissions (user_id);

-- ─── Generated Reports ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.generated_reports (
    id          SERIAL PRIMARY KEY,
    org_id      UUID,
    report_type VARCHAR(100),
    status      VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating','ready','failed')),
    data        JSONB       DEFAULT '{}',
    options     JSONB       DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_reports_org    ON dashboard.generated_reports (org_id);
CREATE INDEX IF NOT EXISTS idx_dash_reports_status ON dashboard.generated_reports (status);

-- ─── Portal Access ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.portal_access (
    id               SERIAL PRIMARY KEY,
    org_id           UUID,
    shareholder_id   INTEGER REFERENCES dashboard.shareholders(id) ON DELETE CASCADE,
    token            VARCHAR(200) UNIQUE NOT NULL,
    pin_hash         VARCHAR(200),
    is_active        BOOLEAN     DEFAULT true,
    last_accessed_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_portal_token ON dashboard.portal_access (token);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.notifications (
    id         SERIAL PRIMARY KEY,
    org_id     UUID,
    user_id    INTEGER,
    title      VARCHAR(500) NOT NULL,
    message    TEXT,
    read       BOOLEAN      DEFAULT false,
    type       VARCHAR(50),
    link       VARCHAR(500),
    created_at TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_notif_user ON dashboard.notifications (user_id, read);

-- ─── Operations Alerts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.operations_alerts (
    id          SERIAL PRIMARY KEY,
    org_id      UUID,
    title       VARCHAR(500) NOT NULL,
    message     TEXT,
    severity    VARCHAR(20)  DEFAULT 'Info' CHECK (severity IN ('Critical','Warning','Info')),
    status      VARCHAR(30)  DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
    business_id INTEGER REFERENCES dashboard.domains(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  DEFAULT now(),
    updated_at  TIMESTAMPTZ  DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_alerts_org      ON dashboard.operations_alerts (org_id);
CREATE INDEX IF NOT EXISTS idx_dash_alerts_status   ON dashboard.operations_alerts (status);
CREATE INDEX IF NOT EXISTS idx_dash_alerts_severity ON dashboard.operations_alerts (severity);

-- ─── Alert Rules ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard.alert_rules (
    id                     SERIAL PRIMARY KEY,
    org_id                 UUID,
    name                   VARCHAR(200) NOT NULL,
    condition              VARCHAR(200),
    threshold              DECIMAL(12,2),
    metric                 VARCHAR(100),
    is_active              BOOLEAN     DEFAULT true,
    notification_channels  JSONB       DEFAULT '[]',
    created_at             TIMESTAMPTZ DEFAULT now(),
    updated_at             TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dash_alert_rules_org ON dashboard.alert_rules (org_id);
