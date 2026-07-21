-- Migration 038: Direct (1:1) messaging
-- Run once against baalvion_db after migration 037.
--
-- Distinct from community.community_chat_messages (per-community GROUP chat, membership-gated) —
-- this is private 1:1 messaging between two specific platform users (e.g. a buyer messaging the
-- seller of a product they're considering). Lives in the community schema alongside the other
-- messaging tables since community-service already owns the real-time chat domain and its
-- realtime-service fan-out wiring.
--
-- user_a_id/user_b_id are always stored with user_a_id < user_b_id (enforced by the application
-- layer, not the DB) so a UNIQUE constraint on the pair prevents ever creating two conversations
-- between the same two users regardless of who initiated it.

CREATE TABLE IF NOT EXISTS community.direct_conversations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id        UUID NOT NULL,
    user_b_id        UUID NOT NULL,
    -- Optional human-readable context for what this conversation is about (e.g. "Seller of
    -- <product name>") — set once at creation so the UI has something to show without a
    -- cross-service user-directory lookup. Never authoritative identity, display-only.
    context_label    TEXT,
    last_message_at  TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT direct_conversations_pair_unique UNIQUE (user_a_id, user_b_id),
    CONSTRAINT direct_conversations_distinct_users CHECK (user_a_id <> user_b_id),
    CONSTRAINT direct_conversations_ordered_pair CHECK (user_a_id < user_b_id)
);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user_a ON community.direct_conversations (user_a_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user_b ON community.direct_conversations (user_b_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS community.direct_messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES community.direct_conversations(id) ON DELETE CASCADE,
    sender_id        UUID NOT NULL,
    content          TEXT NOT NULL,
    read_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON community.direct_messages (conversation_id, created_at);
