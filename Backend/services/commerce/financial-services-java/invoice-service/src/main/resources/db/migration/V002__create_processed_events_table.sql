-- Inbox de-duplication for invoice-affecting events (exactly-once application).
CREATE TABLE invoice.processed_events (
  event_id varchar(160) PRIMARY KEY,
  processed_at timestamp NOT NULL
);
