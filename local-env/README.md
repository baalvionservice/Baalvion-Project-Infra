# Baalvion local "production-like" environment

Run the three frontends on real-looking local domains, with a single reverse proxy
that also fronts the backend fleet on each app's own origin — so the browser makes
**no cross-origin and no mixed-content requests**, exactly like production behind a
gateway.

| App | Local domain | Behind the scenes |
|-----|--------------|-------------------|
| Imperialpedia | http://imperialpedia.local | Next on :3029 |
| Admin Platform | http://admin.baalvion.local | Next on :3030 |
| Investor Relations | http://ir.baalvion.local | Next on :3027 |
| API gateway | `http://<app-domain>/__api/<service>/*` | proxied to backend ports |

The proxy maps `/__api/<service>/*` on **every** app domain to the right backend
(`imperialpedia`→3004, `cms`→3011, `admin`→3021, `session`→3022, `oauth`→3023,
`rbac`→3055, `audit`→3032, `notifications`→3031, `commerce`→3012, … full list in
`reverse-proxy.mjs`). Auth keeps its existing same-origin `/auth-bff` (and IR's
`/api/auth-local`) flow, so the `baalvion_refresh` httpOnly cookie is set per app
origin just like prod.

---

## One-time setup

### 1. Hosts file (Administrator)
Right-click PowerShell → **Run as administrator**, then:
```powershell
& "D:\Baalvion Projects\local-env\setup-hosts.ps1"
```
Adds `127.0.0.1` entries for the four domains (IPv4 on purpose — Docker Desktop
holds IPv6 `:::80`, IPv4 `:80` is free for our proxy).

### 2. Build the frontends (env changed → rebuild required)
`NEXT_PUBLIC_*` values are inlined at build time, so a rebuild is mandatory after
switching to the `.local` wiring:
```powershell
& "D:\Baalvion Projects\local-env\build-frontends.ps1"
```

---

## Run everything

Make sure the backend fleet is up (Docker infra + services + pm2), then:

```powershell
# 1. start the three production builds (each in its own window)
& "D:\Baalvion Projects\local-env\start-frontends.ps1"

# 2. start the reverse proxy (keep this window open)
& "D:\Baalvion Projects\local-env\start-proxy.ps1"
```

Open:
- **http://imperialpedia.local**
- **http://admin.baalvion.local**  (login: `superadmin@baalvion.com` / `<set-by-your-admin>`)
- **http://ir.baalvion.local**  (login: `admin@baalvion.com` / `Admin123!`)

> If port 80 is unavailable, run with `$env:PROXY_PORT='8080'` and use
> `http://imperialpedia.local:8080` etc.

---

## Optional: local HTTPS (Caddy)

For trusted `https://` with the same routing:

```powershell
winget install CaddyServer.Caddy          # or: choco install caddy
caddy trust                               # elevated — installs Caddy's local root CA
caddy run --config "D:\Baalvion Projects\local-env\Caddyfile"
```

Then flip the frontend `.env.local` URLs from `http://` to `https://` (and the
admin `NEXT_PUBLIC_WS_URL` to `wss://admin.baalvion.local/__api/realtime/...`),
rebuild, and use `https://imperialpedia.local` etc. Stop the Node proxy first —
Caddy replaces it.

---

## Revert to plain localhost

Each `.env.local` was backed up to `.env.local.localhost.bak`:
```powershell
"Imperialpedia-main","admin-platform","IR-Baalvion-main" | ForEach-Object {
  $p = "D:\Baalvion Projects\Frontend\$_\.env.local"
  Copy-Item "$p.localhost.bak" $p -Force
}
```
Rebuild, and remove the `# === Baalvion local env ===` block from the hosts file.

---

## How auth/SSO behaves across apps

`admin.baalvion.local` and `ir.baalvion.local` share the parent `.baalvion.local`,
so a cookie scoped to `.baalvion.local` can be shared between them; `imperialpedia.local`
is a separate site and authenticates independently via its own `/auth-bff` session
(same as production, where the three live on distinct registrable domains). Each app
obtains its session from the same auth-service, so credentials are consistent and
navigation between them is seamless.
