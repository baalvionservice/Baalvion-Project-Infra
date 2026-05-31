-- tenant-service schema — multi-tenant registry, per-app branding, custom domains, entitlements.
CREATE SCHEMA IF NOT EXISTS tenant;

CREATE TABLE IF NOT EXISTS tenant.tenants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             VARCHAR(64) NOT NULL UNIQUE,
    name             VARCHAR(160) NOT NULL,
    status           VARCHAR(16) NOT NULL DEFAULT 'active',
    plan             VARCHAR(48) NOT NULL DEFAULT 'standard',
    parent_tenant_id UUID REFERENCES tenant.tenants (id) ON DELETE SET NULL,
    owner_org_id     VARCHAR(128),
    owner_user_id    VARCHAR(64),
    contact_email    VARCHAR(160),
    metadata         JSONB NOT NULL DEFAULT '{}',
    created_by       VARCHAR(64),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenants_org ON tenant.tenants (owner_org_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenant.tenants (status);

CREATE TABLE IF NOT EXISTS tenant.tenant_branding (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenant.tenants (id) ON DELETE CASCADE,
    app             VARCHAR(64) NOT NULL DEFAULT 'default',
    brand_name      VARCHAR(160),
    logo_url        TEXT,
    logo_dark_url   TEXT,
    favicon_url     TEXT,
    primary_color   VARCHAR(16),
    secondary_color VARCHAR(16),
    accent_color    VARCHAR(16),
    login_bg_url    TEXT,
    custom_css      TEXT,
    support_email   VARCHAR(160),
    support_url     TEXT,
    email_from      VARCHAR(160),
    theme           JSONB NOT NULL DEFAULT '{}',
    enabled         BOOLEAN NOT NULL DEFAULT true,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, app)
);

CREATE TABLE IF NOT EXISTS tenant.tenant_domains (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenant.tenants (id) ON DELETE CASCADE,
    domain       VARCHAR(255) NOT NULL UNIQUE,
    app          VARCHAR(64) NOT NULL DEFAULT 'default',
    verify_token VARCHAR(120) NOT NULL,
    verified     BOOLEAN NOT NULL DEFAULT false,
    cert_status  VARCHAR(16) NOT NULL DEFAULT 'pending',
    is_primary   BOOLEAN NOT NULL DEFAULT false,
    verified_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant.tenant_domains (tenant_id);

CREATE TABLE IF NOT EXISTS tenant.tenant_entitlements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenant.tenants (id) ON DELETE CASCADE,
    feature_key VARCHAR(96) NOT NULL,
    enabled     BOOLEAN NOT NULL DEFAULT true,
    limit_value BIGINT,
    used_value  BIGINT NOT NULL DEFAULT 0,
    metadata    JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, feature_key)
);
