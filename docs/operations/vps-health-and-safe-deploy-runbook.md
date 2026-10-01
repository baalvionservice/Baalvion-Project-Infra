# VPS Health & Safe Single-Service Deploy Runbook

Scope: `baalvion-prod` (200.234.44.65), the single VPS running **all ~19 Baalvion
sites** as one Docker Compose project (36+ containers as of 2026-09-28: Imperialpedia,
GTI, Amarisé, Law Elite Network, Jobs Portal, Insiders, IR, CanWeMarry, the identity/
platform/commerce/ecosystem backend services, Postgres, Redis, Neo4j, Caddy, NodeBB…).

The real production stack lives **only** on the VPS at `/opt/baalvion/stack/` and is
**not** a git checkout — it is not tracked in this repo. This doc exists so that
"why is a site down / why isn't my merged change live" can be diagnosed in minutes
instead of hours, and so a deploy to one site never risks the other 18.

Written after the 2026-09-28 incident: a `next build` + `pnpm install` run directly
on the VPS (instead of in CI/a separate build box) exhausted RAM, filled swap, and
wedged the Docker daemon for the whole box — see §1. Separately, Imperialpedia's
admin-dashboard feature had already been merged to `origin/main` but the live PHP
container's image was stale (built before the merge) — see §3.

## 0. Access and the current deploy mechanism (read before touching anything live)

**Getting access:** every command below assumes an SSH config alias named
`baalvion-prod` already exists locally (`ssh baalvion-prod "..."` — see `~/.ssh/config`).
This doc does not document how that key is issued or where it's stored — ask the
repo owner for it; there is currently no self-service path.

**Two deploy mechanisms currently coexist, unreconciled — know which one you're using:**

1. **Manual, on-box build** (what §5 below documents, and what the compose config
   evidences: `image: <name>:local`, `pull_policy: never`). You SSH in, `docker build`
   the new image directly on the live host, then `docker compose up -d --no-deps
   <service>`. This is the pattern the 2026-09-28 incident happened under (§1) — building
   on the box competes with it serving live traffic for all ~19 other sites.
2. **GHCR push, via `.github/workflows/build-hostinger-images.yml`** (triggered on push
   to `main`). This workflow was built specifically to replace (1) — it builds the image
   in CI and pushes to `ghcr.io`, so the box would only need `docker pull` + restart.
   **But its own header comment only describes the build+push side.** Nothing in this
   repo confirms what (if anything) actually runs `docker pull` on the box afterward —
   no cron job, webhook, or second workflow step was found. Until that's confirmed,
   treat (2) as "images land in GHCR" only, not as "the site is now updated."

If you're deploying and unsure which path applies, SSH in first and check whether the
target service's image `pull_policy` in `/opt/baalvion/stack/docker-compose.app.yml`
is `never` (pattern 1) — and if so, use §5's manual build steps, not just a `git push`.

---

## 0. Golden rules

1. **Never run a build, `pnpm install`, `next build`, or any other memory-heavy
   compile step directly on `baalvion-prod`.** The box has 7.8GB RAM total and is
   already running 36+ live services — one stray build process is enough to exhaust
   RAM, fill all 4GB of swap, and wedge the Docker daemon for every site on the box
   (this is exactly what happened in the 2026-09-28 incident — see §1). Build
   locally or in CI, ship an image or a synced artifact instead.
2. **A deploy for one site should only ever touch that one site's container.**
   Always snapshot → apply → diff (§4) so you can *prove* nothing else moved.
3. **Check whether the code is already merged before assuming a "deploy" is
   needed.** Compare the target container's image `Created` timestamp against the
   merge time of the feature in git — often the code is already on `origin/main`
   and only the live image is stale (§3), not a "need to push" problem.
4. **`git status`/`git log origin/main..main` your local `main` before assuming
   anything is or isn't pushed.** Local `main` and `origin/main` can silently
   diverge (each ahead of the other) after enough work sessions; a bare `git push`
   will be rejected, and blindly merging is how unrelated in-progress work leaks
   into production.

---

## 1. VPS-wide symptom: everything times out / 524s / SSH feels slow

This is a **memory-exhaustion / swap-thrashing** signature, not a per-site bug.
Diagnose with commands that don't depend on Docker (so they still return even if
the daemon itself is wedged):

```bash
ssh baalvion-prod "uptime; free -h; df -h /"
```

Red flags:
- `load average` in the hundreds (normal is single digits for this box).
- `Swap:` used ≈ total (fully exhausted).
- `available` memory near zero.

If `docker ps` also hangs indefinitely, the Docker daemon itself is wedged — this
follows directly from the memory pressure above (it's not a separate failure).

### Find the culprit
```bash
ssh baalvion-prod "ps aux --sort=-%mem | head -20"
```
Look for anything that shouldn't be running live on this box at all — a `next
build`, `pnpm install`, `webpack`, `tsc --build`, a data migration script, etc.
State `D`/`Dl` (uninterruptible sleep) on a heavy process is a strong tell: it's
stuck waiting on disk I/O because of swap thrashing.

### Recovery — least disruptive first
```bash
ssh baalvion-prod "kill -9 <pid> <pid>..."
ssh baalvion-prod "sleep 20; uptime; free -h"      # confirm load/swap recovering
ssh baalvion-prod "docker ps"                       # confirm daemon responds again
```
Only reach for a full `systemctl restart docker` or VM reboot if killing the
specific runaway process(es) doesn't relieve the pressure — those options cause a
brief outage across **every** site on the box, so treat them as last resort and
flag the blast radius before running them.

---

## 2. Is a container actually reachable? (bypass Cloudflare/Caddy)

Public HTTPS checks (`curl https://<domain>/...`) go through Cloudflare → Caddy →
container, and can give misleading results (524s, inconsistent timeouts) if the
box is under memory pressure or if your own network path to the VPS is flaky.
Always confirm at the container level directly, from inside the VPS's Docker
network:

```bash
# find the container's internal port + network
ssh baalvion-prod "docker inspect <container> --format '{{.Config.ExposedPorts}} networks={{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}} {{end}}'"

# curl it directly over that network (bypasses Cloudflare + Caddy entirely)
ssh baalvion-prod "docker run --rm --network <network> curlimages/curl -sI -o /dev/null -w 'HTTP %{http_code} time=%{time_total}\n' http://<compose-service-name>:<port>/<path>"
```
Use the **compose service name** (e.g. `app-imperialpedia-php-web`), not the
container's `docker ps` name — after a `compose up` recreate, the service name is
the reliable DNS entry on the network; the container name is also usually fine but
the service name is guaranteed.

Note: most of these containers publish **no host port at all** (`docker port
<container>` returns empty) — they're only reachable via the internal
`baalvion_default` network, routed in from outside by Caddy. Don't assume a
`localhost:<port>` guess is correct; verify with `docker port` or `docker inspect`
first.

---

## 3. "My merged code isn't showing live" — deploy-gap checklist

Work through in order; don't assume it's a push problem before checking:

1. **Is the feature actually merged?**
   ```bash
   git log origin/main -1 -- <path/to/file>
   git diff origin/main -- <path/to/file>      # empty diff = your local copy already matches origin/main
   ```
2. **When was the live container's image built, relative to the merge?**
   ```bash
   ssh baalvion-prod "docker inspect <container> --format 'Created: {{.Created}}'"
   ```
   If `Created` predates the merge commit's date, the image is stale — this is a
   rebuild/redeploy problem, not a git problem.
3. **Confirm by md5-comparing the file inside the running container against the
   merged version:**
   ```bash
   ssh baalvion-prod "docker exec <container> md5sum /var/www/html/<path>"
   md5sum <local-clean-checkout-path>/<path>          # or `md5` on macOS
   ```

If local `main` has unpushed/diverged commits mixed in with the feature you want
live, **don't push the whole branch**. Cherry-pick just the relevant commit(s)
onto a fresh branch off `origin/main`, open a normal PR, and only deploy after
that merges — see §0 rule 4. Verify first whether the feature is *already* on
`origin/main` under a different commit hash (it may have been split out into its
own PR already — check `git log origin/main -1 -- <path>`).

---

## 4. Safe single-service redeploy procedure

Applies to any one of the 36+ services on this box. Every step is scoped so nothing
else on the VPS is affected, and steps 1/5 make that provable rather than assumed.

### Step 0 — find the service's build source and compose files
```bash
ssh baalvion-prod "docker inspect <container> --format 'Image: {{.Image}}'"
ssh baalvion-prod "grep -B2 -A 15 '<service-name>' /opt/baalvion/stack/docker-compose.app.yml"
ls /opt/baalvion/stack/*.yml    # data / app / caddylive / caddytest / forum — services are split across these
```
Most legacy/PHP-style services here use a **pre-built local image**
(`image: <name>:local`, `pull_policy: never`) rather than a compose `build:`
context — meaning compose itself won't rebuild it; you rebuild manually from a
staging directory on the VPS (found via `docker inspect <container>` → `Mounts`,
or by searching `/opt/baalvion/build/*` and `/opt/baalvion/app/*-stage`).

### Step 1 — snapshot every container (the safety net)
```bash
ssh baalvion-prod "docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.CreatedAt}}' > /tmp/pre-deploy-snapshot.txt"
```

### Step 2 — sync clean, approved code to the staging directory
Never rsync from a working branch that has unrelated local changes. Build a clean
detached worktree of `origin/main` first:
```bash
git worktree add --detach /tmp/<name>-deploy-origin-main origin/main
```
Then sync just the relevant app folder up, excluding anything environment-specific
that must survive on the server (check that app's `.gitignore` for the exact list —
typically `.env`, `uploads/`, `application/cache/*`, `application/logs/*`,
`vendor/`, `composer.lock`):
```bash
rsync -avz --delete \
  --exclude='.env' --exclude='uploads/' --exclude='vendor/' \
  --exclude='application/cache/*' --exclude='application/logs/*' \
  --exclude='.git/' --exclude='.DS_Store' \
  /tmp/<name>-deploy-origin-main/<app-path>/ \
  baalvion-prod:<staging-path>/
git worktree remove /tmp/<name>-deploy-origin-main   # cleanup when done
```
(`--delete` without `--delete-excluded` will NOT remove the excluded
environment-specific files on the server — that's what keeps `.env`/`uploads/`
safe.)

### Step 3 — rebuild the image
```bash
ssh baalvion-prod "docker build -t <image-name>:local <staging-path>"
```

### Step 4 — validate the merged compose config before applying anything
`docker compose ... up` needs the **full** service graph to resolve
`depends_on`/cross-file references, even with `--no-deps`. Figure out which
combination of `docker-compose.*.yml` files is needed (usually `data.yml`, which
defines shared infra like `redis`/`postgres`/`neo4j`, plus `app.yml`):
```bash
ssh baalvion-prod "cd /opt/baalvion/stack && docker compose -f docker-compose.data.yml -f docker-compose.app.yml config --services"
```
This only renders config — it does not touch any container. Confirm the service
list looks right (your target service + `redis`/`postgres`/etc. all present, no
surprises) before moving on.

### Step 5 — apply, scoped to one service
```bash
ssh baalvion-prod "cd /opt/baalvion/stack && docker compose -f docker-compose.data.yml -f docker-compose.app.yml up -d --no-deps <service-name>"
```
An "orphan containers" warning about unrelated services (e.g. `nodebb`) is
expected noise from this box's history of compose-file reshuffles — harmless,
ignore it.

### Step 6 — diff against the snapshot (prove the blast radius)
```bash
ssh baalvion-prod "docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.CreatedAt}}' > /tmp/post-deploy-snapshot.txt; diff /tmp/pre-deploy-snapshot.txt /tmp/post-deploy-snapshot.txt"
```
**The only line(s) that should appear in the diff are your target container**,
with a new, very-recent `Created` timestamp. If anything else shows up, stop and
investigate before doing anything further.

### Step 7 — verify the deploy actually landed
```bash
# code matches what you intended to ship
ssh baalvion-prod "docker exec <container> md5sum <path/to/changed/file>"

# app responds, bypassing Cloudflare/Caddy (see §2)
ssh baalvion-prod "docker run --rm --network baalvion_default curlimages/curl -sI -o /dev/null -w 'HTTP %{http_code} time=%{time_total}\n' http://<service-name>:<port>/<path>"
```

---

## 5. Quick reference — Imperialpedia (worked example, 2026-09-28)

| Thing | Value |
|---|---|
| Naming rule | `imperialpedia-php-*` = the PHP/CodeIgniter site, `imperialpedia-nextjs-*` = the Next.js app. Anything still named `legacy-imperialpedia-*` (DB service, volumes, stage dir) is the PHP site — a leftover name, not a third system. |
| Live PHP container | `baalvion-app-imperialpedia-php-web-1` (compose service `app-imperialpedia-php-web`) |
| Next.js container (also running, not yet cut over as primary) | `baalvion-app-imperialpedia-nextjs-main-1` |
| DB container | `baalvion-app-legacy-imperialpedia-db-1` |
| Image | `baalvion-legacy-imperialpedia-web:local`, `pull_policy: never` |
| Staging/build dir | `/opt/baalvion/app/legacy-imperialpedia-stage` (not a git repo — plain synced tree) |
| Internal port / network | `80` / `baalvion_default` |
| Uploads persistence | named volume `baalvion_legacy_imperialpedia_uploads` mounted at `/var/www/html/uploads` — deliberately **not** baked into the image, so an image rebuild never wipes admin-uploaded content |
| Admin panel route | `/imp-admin` (login), `/imp-admin/dashboard` (after login) |
| Local dev equivalent | `Frontend/Imperialpedia-main/docker-compose.yml` → `http://localhost:8000/imp-admin` |
