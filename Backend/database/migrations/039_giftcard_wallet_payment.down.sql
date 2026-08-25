-- Rollback for 039_giftcard_wallet_payment.sql
ALTER TABLE giftcard.gift_card_orders
  DROP COLUMN IF EXISTS wallet_hold_id,
  DROP COLUMN IF EXISTS payment_method;
