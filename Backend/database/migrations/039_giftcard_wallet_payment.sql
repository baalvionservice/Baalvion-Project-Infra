-- Lets a gift card be paid for out of the buyer's wallet balance (wallet-service, financial-
-- services-java) instead of a fresh per-order crypto charge. payment_method distinguishes the two
-- checkout paths; wallet_hold_id records the wallet-service hold placed at checkout time so it can
-- be captured on successful fulfillment or released (auto-refunded) on a supplier failure.
ALTER TABLE giftcard.gift_card_orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) NOT NULL DEFAULT 'CRYPTO'
    CHECK (payment_method IN ('CRYPTO', 'WALLET')),
  ADD COLUMN IF NOT EXISTS wallet_hold_id UUID;
