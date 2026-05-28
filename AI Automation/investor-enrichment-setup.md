# Investor Enrichment Workflow — Setup Guide

This is the first n8n workflow in the investor intelligence platform: it picks up new investor rows marked `pending` and uses an AI Agent with three tools (Crunchbase, Google Search via SerpAPI, and URL fetch) to enrich them with website, AUM, firm type, HQ, focus sectors, and verified social media handles. Results are written back to Postgres and a Slack notification fires for human QA.

## Files

- `investor-enrichment-agent.n8n.json` — the importable n8n workflow
- `investor-db-schema.sql` — Postgres schema with seed data
- `investor-enrichment-setup.md` — this file

## What the workflow does

1. **Every 5 min** a schedule trigger fires.
2. **Claim Pending Rows** runs a single SQL statement that selects up to 3 `pending` investors, locks them with `FOR UPDATE SKIP LOCKED`, and marks them `processing` in the same transaction. This is concurrency-safe; running multiple workflow instances will never double-process a row.
3. **Loop Each Investor** processes one investor at a time.
4. **Enrichment Agent** (the AI Agent node) gets a system prompt that forces sourced output and a strict JSON schema, plus three tools:
   - `crunchbase_search` — HTTP GET to the Crunchbase organizations search API.
   - `google_search` — HTTP GET to SerpAPI.
   - `fetch_url` — HTTP GET to any URL the model decides to read.
5. **Parse Agent Output** is a Code node that JSON-parses the agent's response and validates it. If parsing fails, the row is marked `enrichment_failed` and a Slack alert fires.
6. **Update Investor** writes website, AUM, firm type, HQ, focus sectors, confidence, and notes back to the row.
7. **Expand Socials → Upsert Social** writes each verified handle to `investor_socials`, upserting on `(investor_id, platform)` so re-runs don't duplicate.
8. **Notify QA Slack** posts a summary card with confidence level so a human can spot-check the first weeks of output.

## Setup steps

### 1. Postgres
Run `investor-db-schema.sql` against your Postgres database. It creates 6 tables and seeds 3 sample investors so you can test the workflow end-to-end immediately.

### 2. API keys you need before importing
- **Anthropic API key** — for the Claude chat model (sign up at console.anthropic.com).
- **Crunchbase API key** — Basic plan from data.crunchbase.com. The Tool node passes it as `X-cb-user-key` header (create a "Header Auth" credential in n8n with header name `X-cb-user-key` and value = your key).
- **SerpAPI key** — serpapi.com, $50/mo for 5k searches. Passed as a query parameter.
- **Slack bot token** — for the QA notification.
- **Postgres connection** — host, port, database, user, password.

### 3. Import the workflow
In n8n: **Workflows → Import from File → select `investor-enrichment-agent.n8n.json`**.

After import, open each node that shows a credential warning and pick the credential you just created. The credentials to map are:
- Postgres node (appears 4 times): map to your Postgres credential.
- `Claude Sonnet` node: map to your Anthropic API credential.
- `Crunchbase Tool`: map the Header Auth credential.
- `Google Search Tool`: the API key is currently embedded via `$credentials.serpApi.apiKey` — either create a Custom Auth credential named `serpApi` with field `apiKey`, or simplify by hard-coding the key into the query parameter for now (rotate later).
- `Notify QA Slack` and `Slack Failure Alert`: map your Slack credential and set the channel ID (right-click any Slack channel → View channel details → copy the ID at the bottom).

### 4. Test
1. Activate the workflow.
2. Wait up to 5 minutes (or trigger manually).
3. The 3 seed investors (Naval Ravikant, a16z, Peak XV) should move from `pending` → `processing` → `enriched` over a couple of minutes.
4. Check Slack for the QA cards.
5. Inspect rows in Postgres: `SELECT name, website, aum_usd, enrichment_confidence FROM investors;` and `SELECT * FROM investor_socials;`.

### 5. Production hardening (do these before scaling)
- Wrap the AI Agent in a sub-workflow with retries on tool errors (Claude can flake on long tool calls).
- Add a daily summary workflow: count enriched/failed in last 24h → Slack digest.
- Lower the schedule from 5 min to 1 min once you have >100 pending rows backlog.
- Add a `priority` column to `investors` and `ORDER BY priority DESC, created_at ASC` in the claim query so VAs can fast-track important investors.
- Move credentials to a secret manager and restrict the n8n instance to internal network only.

## What this workflow is NOT doing

Deliberately, to keep this first build clean:

- No social media scraping. Twitter handles are only collected if the agent verifies them via an official source (firm website, Crunchbase profile, AngelList). LinkedIn/Instagram/Facebook are skipped unless verifiable.
- No investment-amount tracking (that's Workflow B — funding rounds via Crunchbase, runs every 6h).
- No news fetching (Workflow C).
- No publishing to marketunderworld.com (Workflow E).

Tell me when you're ready and I'll build the next one. Workflow B (funding round tracker) is the natural next step — it's also Postgres + Crunchbase API and will reuse the same credentials.

## Estimated cost per enrichment

Per investor processed:
- Claude Sonnet input + output: ~$0.02–0.06 depending on how many tool round-trips it does.
- Crunchbase API: 1–3 calls × $0 (within plan quota) — but watch your monthly quota.
- SerpAPI: 1–4 searches × $0.01.
- Total: roughly **$0.05–$0.12 per investor**.

At 500 investors enriched in month 1, that's ~$25–$60. Cheap. The cost wall comes later in Workflow C (hourly news fetch across the full investor base).
