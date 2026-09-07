-- Record which SIDE of the table a message came from.
--
-- deal_messages only stored sender_id (a user id), so the UI had nothing to render but the raw
-- identifier — the deal room literally displayed "USR_INVESTOR" and "FOUNDER-NORTHWIND" as the
-- names on screen. A user id also cannot be resolved to a side after the fact: membership can
-- change, and the identity it belongs to lives in another service. Stamping the sender's org at
-- write time makes "the company said this" a durable property of the message.
--
-- Backfill is deliberately absent: existing rows predate the column and there is no sound way to
-- infer their org. They render as 'unknown' rather than being guessed into a side.

BEGIN;
SET search_path TO marketplace, public;

ALTER TABLE marketplace.deal_messages
    ADD COLUMN IF NOT EXISTS sender_org_id UUID;

COMMIT;
