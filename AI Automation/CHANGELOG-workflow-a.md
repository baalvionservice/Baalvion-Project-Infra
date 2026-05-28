# Workflow A — Changelog

## v2 (current) — bug fixes

Three issues from v1 fixed:

### 1. Data flow broken after Postgres UPDATE
**v1 problem:** `Expand Socials` Code node referenced `$json.investor_id` and `$json.socials`, but a Postgres `UPDATE` without `RETURNING *` returns an empty rowset, so `$json` was empty. The socials never made it to the upsert.

**v2 fix:** Restructured the success branch as:

`Parse OK? (true)` → `Build Update SQL` (Code) → `Update Investor` (Postgres) → `Build Socials SQL` (Code, reads from `$('Parse Agent Output').item.json`) → `Upsert Social` (Postgres) → `Notify QA Slack`

The Code nodes now own SQL construction and pull data via `$('Parse Agent Output').item.json` cross-node references, which survive any number of Postgres pass-throughs. Slack node already used this pattern correctly; nothing changed there.

### 2. Postgres parameterization was wrong for typeVersion 2.5
**v1 problem:** Used `$1, $2` placeholders with `options.queryReplacement` as a comma-separated string. This is inconsistent with how the v2.5 Postgres node binds parameters, and the JSONB value (`focus_sectors`) wouldn't cast properly via that path.

**v2 fix:** Switched to a "Code-builds-SQL, Postgres-executes-SQL" pattern. The Code node escapes all values explicitly (`'`-doubling for strings, `isFinite` check for numbers, allowlist for enums, JSON.stringify + `::jsonb` cast for the array). The Postgres node just runs `={{ $json.sql }}`. This is safe because the Code node controls all interpolation and rejects malformed values.

This pattern is also easier to debug — you can read the generated SQL in the Code node output before it hits the database.

### 3. SerpAPI key reference didn't resolve
**v1 problem:** `Google Search Tool` had `={{ $credentials.serpApi.apiKey }}` inline in a query parameter value. That expression doesn't resolve inside the `toolHttpRequest` node — credentials there have to be attached via the `credentials` block and `authentication: 'genericCredentialType'`.

**v2 fix:** Switched to `genericAuthType: 'httpQueryAuth'` with a Query Auth credential. Create the credential in n8n as:
- Type: **Query Auth**
- Name: `SerpAPI Query Auth (api_key)`
- Key: `api_key`
- Value: your SerpAPI key

n8n will then automatically append `?api_key=YOUR_KEY` to every request from this tool.

## Setup change in v2

You now need **5 credentials in n8n** (one new one vs v1):

1. **Postgres** (used by 5 nodes) — standard Postgres credential.
2. **Anthropic API** — for Claude Sonnet.
3. **Crunchbase** — Header Auth, header name `X-cb-user-key`, value = your Crunchbase user key.
4. **SerpAPI** — *NEW SHAPE in v2:* Query Auth, key `api_key`, value = your SerpAPI key.
5. **Slack** — for the two notification nodes.

Re-importing: in n8n, **Workflows → Import from File** with the new JSON. Existing nodes can't be patched, you'd need to re-import. Your old v1 credentials carry over by name if you set them up under matching names.

## What's still NOT fixed (deliberately)

Things I called out as gaps but didn't fix in this v2 pass:

- **Stuck-row recovery**: if a workflow run crashes mid-flight, the row stays in `processing` forever. Needs a separate cleanup workflow that resets rows older than 30 min back to `pending`. I'll build that next if you want.
- **Structured Output Parser subnode**: the Code node parses JSON defensively, but n8n's LangChain Structured Output Parser is more reliable. Worth swapping in for v3.
- **Rate limit backoff**: Crunchbase and SerpAPI will rate-limit you eventually. No exponential backoff yet.
- **Investor intake**: still no way to add investors except `INSERT` SQL. A webhook trigger + form (Tally or n8n Form) would fix that.
- **Audit log writes**: schema has `audit_log`, nothing writes to it.

Tell me which of these to do next, or whether to move on to Workflow B (investment tracker).
