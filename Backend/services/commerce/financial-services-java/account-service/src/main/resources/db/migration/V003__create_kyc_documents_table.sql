-- Encrypted KYC document vault (design §6.4 / §7.3). Document bytes are AES-256-GCM ciphertext;
-- a plaintext SHA-256 is kept for integrity/dedup. Tenant-isolated via RLS; retention via expires_at.
CREATE TABLE accounts.kyc_documents (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  account_id uuid NOT NULL,
  document_type varchar(32) NOT NULL,        -- PASSPORT, NATIONAL_ID, DRIVERS_LICENSE, UTILITY_BILL, ...
  file_name varchar(200) NOT NULL,
  content_type varchar(100) NOT NULL,
  ciphertext bytea NOT NULL,
  iv bytea NOT NULL,
  sha256 varchar(64) NOT NULL,
  size_bytes bigint NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'PENDING',   -- PENDING, VERIFIED, REJECTED
  uploaded_by varchar(128),
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  expires_at timestamp,
  version bigint,
  CONSTRAINT check_kyc_size CHECK (size_bytes > 0)
);

CREATE INDEX idx_kyc_tenant_account ON accounts.kyc_documents(tenant_id, account_id);
CREATE INDEX idx_kyc_tenant_type ON accounts.kyc_documents(tenant_id, document_type);
CREATE INDEX idx_kyc_expires ON accounts.kyc_documents(expires_at);

ALTER TABLE accounts.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY kyc_documents_tenant_isolation ON accounts.kyc_documents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
