-- 007_org_pending_status.sql
-- Extends the organization lifecycle to support the public onboarding intake.
--
-- A visitor who completes a department onboarding wizard creates an organization
-- in the 'pending' state (no owner, no access). It surfaces in the platform
-- review queue, where an approver activates ('active') or rejects ('rejected').
--
-- Backward-compatible: only widens the allowed set; existing rows are unaffected.

ALTER TABLE auth.organizations DROP CONSTRAINT IF EXISTS chk_org_status;
ALTER TABLE auth.organizations
    ADD CONSTRAINT chk_org_status CHECK (status IN ('active', 'suspended', 'pending', 'rejected'));
