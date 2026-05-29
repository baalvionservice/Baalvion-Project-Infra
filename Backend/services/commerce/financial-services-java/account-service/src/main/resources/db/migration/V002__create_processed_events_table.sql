-- Inbox de-duplication for balance-affecting events (exactly-once application).
CREATE TABLE accounts.processed_events (
  event_id varchar(160) PRIMARY KEY,
  processed_at timestamp NOT NULL
);
