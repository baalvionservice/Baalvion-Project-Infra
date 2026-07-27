# NodeBB — the forum engine behind community.marketunderworld.com/forum (see plan doc:
# Frontend/community.marketunderworld.com integrates NodeBB via its Write API rather than
# reimplementing thread/post storage — Backend/services/ecosystem/community-service owns
# membership/RBAC/paid-tiers and grants/revokes NodeBB group access on top of this).
#
# PINNED to a tagged release — do NOT float :latest or `master`, this is a production forum
# with real user data. Bump NODEBB_VERSION deliberately (and re-run bootstrap/seed-categories.js
# against a staging instance first) when upgrading.
FROM node:20-bookworm-slim AS base
ARG NODEBB_VERSION=v3.9.1
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
# NodeBB's repo .gitignores /package.json (only the install/package.json TEMPLATE is
# tracked) — a plain `git clone` alone leaves no manifest for npm to install against.
# Confirmed against the actual v3.9.1 tag tree (GitHub API + a real clone): root
# package.json is absent at every checked tag; install/package.json is the real one.
RUN git clone --depth 1 --branch ${NODEBB_VERSION} https://github.com/NodeBB/NodeBB.git . \
    && cp install/package.json package.json \
    && npm install --omit=dev --no-audit --no-fund

# Plugins this deployment depends on:
#   nodebb-plugin-sso-oauth2-multiple — already configured in prod, SSO via oauth-service's
#     OIDC provider (deploy/consolidated/caddy/Caddyfile, the /oidc-provider/* carve-out).
#   nodebb-plugin-write-api — admin-issued bearer token, used exclusively by
#     community-service's service/nodebbClient.js for server-to-server group/category calls.
RUN npm install --omit=dev --no-audit --no-fund \
    nodebb-plugin-sso-oauth2-multiple \
    nodebb-plugin-write-api

COPY config.json /usr/src/app/config.json

EXPOSE 4567
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
    CMD node -e "require('http').get('http://127.0.0.1:4567/api/config',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
# `./nodebb start` daemonizes (forks + detaches) — the container's PID 1 exits immediately
# after forking, so Docker sees the process end and restarts the container in a loop. NodeBB's
# own official entrypoint (install/docker/entrypoint.sh) runs `npm start -- ... --no-daemon`
# for exactly this reason. config.json is baked into the image (COPY above), so this boots
# straight to the web server — first admin setup happens via the web install wizard on first
# visit, matching the original operator-supervised, not-silently-automated intent.
CMD ["npm", "start", "--", "--config=/usr/src/app/config.json", "--no-silent", "--no-daemon"]
