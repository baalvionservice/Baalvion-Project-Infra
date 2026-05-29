-- External scheme reference assigned by the downstream scheme adapter (design §6.2).
ALTER TABLE payments.transactions ADD COLUMN IF NOT EXISTS scheme_ref varchar(64);
