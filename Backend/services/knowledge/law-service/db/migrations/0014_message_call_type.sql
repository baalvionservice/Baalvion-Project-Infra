-- 0014_message_call_type.sql — adds a 'call' message type for call-invite
-- messages (ad-hoc video/voice, spec area 7), alongside the existing
-- text/file/system types. Additive to the enum only — no data migration.
ALTER TYPE legal.enum_messages_type ADD VALUE IF NOT EXISTS 'call';
