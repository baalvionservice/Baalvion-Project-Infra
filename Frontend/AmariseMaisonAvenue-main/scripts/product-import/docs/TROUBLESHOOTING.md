# Troubleshooting

Concrete errors and their fixes. Several of these are documented from real incidents
hit while building/verifying this exact system against production — not
hypothetical.

---

### `login failed: status 401` / `Login failed (status 401)`

Wrong `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD`, or `AUTH_URL` pointing at the wrong
environment (e.g. local `AUTH_URL` while `COMMERCE_URL` points at production, or
vice versa). Confirm both URLs point at the *same* environment.

### `fetch failed` with no HTTP status, `ConnectTimeoutError`

This is a **transport-level** failure — the request never got a response at all.
Two common causes:

1. **IPv6/NAT64 DNS resolution hang.** Node's native `fetch` (undici) can try an
   IPv6 address first and hang for the full timeout before ever trying IPv4, even
   when the IPv4 path works fine (verifiable with `curl` to the same URL). Fix:
   ```bash
   NODE_OPTIONS="--dns-result-order=ipv4first" node scripts/import-products.cjs ...
   ```
   This was the exact root cause the first time these scripts were run against
   `api.baalvion.com` from a sandboxed environment — `curl` worked immediately,
   Node's `fetch` didn't until this flag was added.
2. **Genuine network flakiness** to the target host. The built-in retry
   (`IMPORT_MAX_RETRIES`/`IMPORT_RETRY_DELAY_MS`) already handles transient drops;
   if every attempt fails, it's not transient — check connectivity directly with
   `curl` to the same URL.

### `{"code":"NOT_FOUND","message":"Route not found"}` on every request, even authenticated ones

This means the API path you're calling isn't exposed at the edge (reverse
proxy/Caddy) that received the request — the *request never reached
commerce-service at all*. Telltale sign: an unauthenticated request gets a clean
`401 "No bearer token provided"`, but the same request WITH a valid token gets
`404 "Route not found"` — that combination means something in front of the app
(a gateway, BFF, or edge proxy) is intercepting unauthenticated requests but has no
route mapped for the authenticated path, so it falls through to a generic 404.

This is an infrastructure/deploy issue, not something these scripts can work around
— the fix is adding the missing route/carve-out on the server side (see this
project's `deploy/consolidated/caddy/Caddyfile` for the pattern other authed
commerce routes already use). Confirm with whoever manages that deployment before
assuming it's a client-side bug.

### `403 FORBIDDEN` — "You must be super_admin or the country_admin for ... to create a store there" (from `seed-amarise-commerce-catalog.cjs`, not these scripts directly, but the same account is used)

The logged-in account's **auth-service role** (e.g. `platform_admin`) is not the
same thing as an **RBAC-service role grant** (`super_admin`/`country_admin`).
commerce-service's authorization checks call out to rbac-service for the caller's
*actual* effective roles — having an impressive-sounding email/role in the JWT
doesn't automatically mean rbac-service has a matching grant on file. This has to
be fixed by whoever administers rbac-service granting the account the right role —
it is not something `SUPERADMIN_PASSWORD` alone can bypass.

### `409 CONFLICT` — `{"code":"RBAC_NOT_PROVISIONED","message":"RBAC role 'store_admin' is missing..."}`

Commerce's own role catalogue (`store_admin`, `product_manager`, etc.) hasn't been
provisioned into rbac-service yet for this environment. This is a one-time,
idempotent setup step — see `Backend/services/commerce/commerce-service/scripts/
provisionCommerceRbac.cjs`. Not something to run casually against production
without understanding what it does; ask whoever manages the deployment first.

### `409 CONFLICT` on product/category/collection create — "already exists"

Expected and harmless for products/collections during a re-run — `import-products.cjs`
and `create-collections.cjs` both check for existing SKUs/slugs *before* attempting
create, specifically to avoid ever hitting this. If you see it anyway, something
else (a manual admin-UI entry, a partial prior run) created that SKU/slug outside
this tool. Check admin-platform for the existing record before deciding what to do.

### A row is skipped with "unknown Category"

The `Category` column must be a category **slug**, not its display name — e.g.
`hermes-birkin-handbags`, not "Birkin Bags". Check Commerce → Categories in
admin-platform for the exact slug, or run `validate-products.cjs` in LIVE mode
(set `STORE_ID` + `SUPERADMIN_PASSWORD`) to get this checked automatically before
you import anything.

### Image upload fails: "local image file not found"

Local paths in the `Images` column are resolved **relative to the CSV file's own
directory**, not your current working directory. If your CSV is at
`sample-data/products.csv` and references `photos/bag.jpg`, that file needs to be
at `sample-data/photos/bag.jpg`.

### Image upload fails: "image fetch failed (HTTP 404)"

The URL in `Images` doesn't actually serve an image (dead link, private/gated URL,
or — if you're testing with the sample CSV as-is — the placeholder
`https://example.com/sample-images/...` URLs, which are intentionally
non-functional; see `docs/CSV_SPEC.md`). Replace with a real, publicly-fetchable
URL.

### `guardUpload` / upload security rejection

commerce-service validates every upload's actual file bytes against its declared
type (magic-byte check) and scans for malware before accepting it — a file with a
`.jpg` extension but non-image content, or a corrupted download, will be rejected
even though the URL/path itself was fine. Verify the source file opens correctly as
an image before re-trying.

### `Sale Price` doesn't show a strikethrough on the storefront

Expected for now — see the note in `docs/CSV_SPEC.md`. The value is stored
correctly (`compareAtPrice` on the default variant); the storefront UI simply
doesn't render it yet.

### The whole script exits immediately with "STORE_ID is required" / "SUPERADMIN_PASSWORD is required"

Environment variables aren't being read. Confirm you exported them into the current
shell (`.env` files are **not** auto-loaded by these scripts — see
`docs/IMPORT_GUIDE.md` §2) and that you're running the command in the same shell
session where you exported them.

### I ran an import and want to undo it

There's no bulk-undo by design — see "Rollback" in `docs/IMPORT_GUIDE.md`. Use the
`import-report-<timestamp>.json` file written next to your CSV as the authoritative
list of exactly what that run created.
