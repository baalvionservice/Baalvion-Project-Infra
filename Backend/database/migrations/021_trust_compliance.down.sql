-- 021_trust_compliance.down.sql — rollback

BEGIN;

DROP TRIGGER IF EXISTS trg_compaudit_no_mutate ON public.compliance_audit_logs;
DROP TRIGGER IF EXISTS trg_modevent_no_mutate ON public.moderation_events;

DROP TABLE IF EXISTS public.compliance_audit_logs;
DROP TABLE IF EXISTS public.gdpr_requests;
DROP TABLE IF EXISTS public.consent_records;
DROP TABLE IF EXISTS public.enforcement_actions;
DROP TABLE IF EXISTS public.destination_intel;
DROP TABLE IF EXISTS public.moderation_events;
DROP TABLE IF EXISTS public.moderation_cases;
DROP TABLE IF EXISTS public.risk_scores;
DROP TABLE IF EXISTS public.kyc_verifications;

ALTER TABLE public.organizations
  DROP COLUMN IF EXISTS kyc_status,
  DROP COLUMN IF EXISTS risk_level;

COMMIT;
