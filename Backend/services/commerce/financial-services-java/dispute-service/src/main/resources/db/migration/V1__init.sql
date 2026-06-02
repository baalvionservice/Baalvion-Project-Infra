-- Dispute domain: three-tier resolution (AI triage → mediation → ICC arbitration).
-- One isolated schema per service. Money is numeric(19,4).
CREATE SCHEMA IF NOT EXISTS dispute;

CREATE TABLE IF NOT EXISTS dispute.disputes (
  id                    UUID PRIMARY KEY,
  tenant_id             UUID NOT NULL,
  idempotency_key       VARCHAR(255) NOT NULL,
  reference             VARCHAR(40) NOT NULL,             -- DSP-2026-AB12CD34
  subject_type          VARCHAR(20) NOT NULL,             -- ORDER, DEAL, CONTRACT, SHIPMENT
  subject_id            UUID,
  raised_by             VARCHAR(10) NOT NULL,             -- BUYER, SELLER
  claimant_id           UUID,
  claimant_name         VARCHAR(255),
  respondent_id         UUID,
  respondent_name       VARCHAR(255),
  type                  VARCHAR(20) NOT NULL,             -- QUALITY, NON_DELIVERY, PAYMENT, DOCUMENTATION, QUANTITY, OTHER
  amount                NUMERIC(19,4),
  currency              VARCHAR(3),
  description           TEXT NOT NULL,
  evidence              JSONB NOT NULL DEFAULT '[]',
  tier                  VARCHAR(12) NOT NULL DEFAULT 'AI_TRIAGE', -- AI_TRIAGE, MEDIATION, ARBITRATION
  status                VARCHAR(16) NOT NULL DEFAULT 'OPEN',      -- OPEN, AI_REVIEW, AWAITING_RESPONSE, IN_MEDIATION, IN_ARBITRATION, RESOLVED, REJECTED, WITHDRAWN
  ai_recommendation     JSONB,                            -- {recommendation, confidence, inFavorOf, splitPct, rationale}
  mediator_id           UUID,
  arbitrator_id         UUID,
  -- proposed settlement (mediation tier)
  proposed_in_favor_of  VARCHAR(10),
  proposed_amount       NUMERIC(19,4),
  proposed_terms        TEXT,
  -- final outcome
  resolution_type       VARCHAR(12),                      -- SETTLED, AWARD, DISMISSED, WITHDRAWN
  resolved_in_favor_of  VARCHAR(10),                      -- BUYER, SELLER, SPLIT
  award_amount          NUMERIC(19,4),
  resolution_note       TEXT,
  created_by            VARCHAR(255),
  metadata              JSONB NOT NULL DEFAULT '{}',
  deadline_at           TIMESTAMP,
  opened_at             TIMESTAMP NOT NULL DEFAULT now(),
  resolved_at           TIMESTAMP,
  created_at            TIMESTAMP NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP,
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_dsp_tenant_status ON dispute.disputes (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dsp_subject ON dispute.disputes (subject_type, subject_id);

-- Timeline of actions across the tiers (audit trail).
CREATE TABLE IF NOT EXISTS dispute.dispute_actions (
  id            UUID PRIMARY KEY,
  dispute_id    UUID NOT NULL REFERENCES dispute.disputes(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  tier          VARCHAR(12),
  actor         VARCHAR(40),                              -- BUYER, SELLER, MEDIATOR, ARBITRATOR, AI, SYSTEM
  action        VARCHAR(40) NOT NULL,                     -- OPENED, AI_TRIAGED, RESPONDED, ESCALATED, PROPOSED, ACCEPTED, REJECTED, AWARDED, WITHDRAWN
  note          TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dsp_action_dispute ON dispute.dispute_actions (dispute_id, created_at);
