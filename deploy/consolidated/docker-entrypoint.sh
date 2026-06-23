#!/bin/sh
# Consolidated stack entrypoint. Validate the environment, then hand off to the
# compose CMD (pm2-runtime start /app/pm2/<app>.config.js). tini stays PID 1 (set in
# the Dockerfile ENTRYPOINT) so SIGTERM still reaches each module's graceful-shutdown.
set -e
node /app/preflight-env.js
exec "$@"
