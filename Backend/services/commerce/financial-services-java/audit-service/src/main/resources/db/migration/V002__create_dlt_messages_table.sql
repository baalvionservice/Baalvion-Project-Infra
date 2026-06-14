-- Dead-letter monitor store (design §4.3): captured poison messages + replay state.
CREATE TABLE finance_audit.dlt_messages (
  id uuid PRIMARY KEY,
  dlt_topic varchar(160) NOT NULL,
  original_topic varchar(160) NOT NULL,
  event_key varchar(160),
  payload jsonb NOT NULL DEFAULT '{}',
  exception_message text,
  status varchar(16) NOT NULL DEFAULT 'DEAD',   -- DEAD, REPLAYED, DISCARDED
  replayed_by varchar(128),
  replayed_at timestamp,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint
);

CREATE INDEX idx_dlt_status_created ON finance_audit.dlt_messages(status, created_at DESC);
CREATE INDEX idx_dlt_original_topic ON finance_audit.dlt_messages(original_topic);
