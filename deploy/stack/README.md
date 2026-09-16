# `deploy/stack` — what production actually runs

This is the real production topology for `baalvion-prod`, captured from the box on
2026-09-09. Until now it existed **only** on that machine, hand-edited in place, with a
dozen `.bak-<timestamp>` copies beside it. One `rm` would have lost it.

## The thing to understand first

`deploy/consolidated/` is **not** what production runs, despite
`Backend/catalog/schema.json` describing that directory as "production truth" and
`catalog/scripts/derive-runtime.mjs` deriving every service's runtime block from it.

Production runs from `/opt/baalvion/stack` on the box, using a **three-file** compose set:

```bash
cd /opt/baalvion/stack
docker compose \
  -f docker-compose.data.yml \
  -f docker-compose.app.yml \
  -f docker-compose.caddytest.yml \
  up -d --no-build --no-deps <service>
```

Using fewer than all three makes compose reconcile services you did not intend to touch.
Read the set off a running container rather than trusting any document, including this one:

```bash
docker inspect <container> --format '{{json .Config.Labels}}' | tr , '\n' | grep compose
```

Note it is `caddytest`, not `caddylive`. Project name is `baalvion`, working directory
`/opt/baalvion/stack`.

The consequence of the split is real: CanWeMarry served traffic for two days while the
service catalog reported it `not-deployed`, because the deriver reads a directory that does
not mention it.

## Files

| File | What it is |
|---|---|
| `docker-compose.app.yml` | Every application container. ~750 lines |
| `docker-compose.data.yml` | Postgres, Redis, Neo4j |
| `docker-compose.caddytest.yml` | The Caddy edge |
| `caddy/Caddyfile` | Every route, every host, every BFF carve-out |
| `.env.example` | **Key names only.** The live `.env` holds 119 values and is not in this repo |

## Secrets

`/opt/baalvion/stack/.env` and `/opt/baalvion/stack/.db-secrets` are **not** here and must
not be. Every compose file references values as `${VAR}`; none carries a literal secret,
which is what made this directory safe to commit at all. Verified before the first commit.

## Never rebuild `:local` in place

Images are pre-built local tags promoted by retagging, never built by compose. Seven
containers share `baalvion-backend:local` — including `app-identity`, which is auth for the
whole estate. A bad image there fails every login on every property.

```bash
docker build -f deploy/consolidated/Dockerfile.node -t baalvion-backend:new .
# smoke-test it, then:
docker tag baalvion-backend:local baalvion-backend:previous
docker tag baalvion-backend:new   baalvion-backend:local
# recreate ONE service at a time, health-gated, auth LAST
```

Check the running image still exists before you touch anything — a long-running container
here can have no rollback point at all, its layers pruned out from under it while it keeps
serving:

```bash
docker images -a --no-trunc | grep "$(docker inspect <c> --format '{{.Image}}')"
```

On 2026-09-09 `app-ecosystem` was running an image that was gone from the store.

## Editing the Caddyfile on the box

Never `sed -i` or `mv` it. It is bind-mounted, so an in-place edit that changes the inode
detaches the mount: the container keeps serving the old file, `caddy validate` reads the
stale copy and reports "Valid", and a reload applies the old config. Write with
`cat tmp > file`, or `docker restart baalvion-caddy-1` to re-bind. Diagnose by comparing
`stat -c %i` on the host against the same inside the container.

## Keeping this file honest

This is a snapshot. It drifts the moment someone edits the box. Re-capture with:

```bash
for f in docker-compose.app.yml docker-compose.data.yml docker-compose.caddytest.yml; do
  ssh baalvion-prod "cat /opt/baalvion/stack/$f" > deploy/stack/$f
done
ssh baalvion-prod 'cat /opt/baalvion/stack/caddy/Caddyfile' > deploy/stack/caddy/Caddyfile
```

The real fix is to deploy *from* here rather than capture *into* here. That is a larger
change and is not what this commit does.
