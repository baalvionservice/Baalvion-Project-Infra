-- Revert 005 — drop refresh-token sessions.
DROP TABLE IF EXISTS trade.refresh_tokens;
