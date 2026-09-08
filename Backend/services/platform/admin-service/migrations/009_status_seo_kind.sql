-- Widen probe_state.kind to admit the web-presence ('seo') probe class.
--
-- 008 enumerated the kinds that existed when it was written. Adding a probe class without
-- widening this constraint makes every one of its writes fail — loudly, in this case, because
-- the sweep logs a persistence failure per target rather than swallowing it, which is how it
-- was caught on the first run. 008 itself has been corrected for fresh installs; this migration
-- brings databases that already applied it to the same shape.
ALTER TABLE admin.probe_state  DROP CONSTRAINT IF EXISTS probe_state_kind_check;
ALTER TABLE admin.probe_state  ADD  CONSTRAINT probe_state_kind_check
    CHECK (kind IN ('service','website','datastore','auth','money','seo'));
