# Imperialpedia PHP site (this is imperialpedia.com)

**Right folder:** `/Users/wade/Desktop/imp-adsense-wt/Frontend/Imperialpedia-main`  (branch `fix/imperialpedia-php-adsense-readiness`).
Shortcut on the Desktop: `Imperialpedia-PHP-LIVE`.
The folder `Baalvion-Project-Infra-main/Frontend/Imperialpedia-main` holds the OLD Next.js app. Ignore it for this site.

## Where things live
| What | Where |
|---|---|
| Real database | live: container `baalvion-app-imperialpedia-php-db-1`, db `legacy_imperialpedia` |
| Local copy of it | docker `imperial_db`, db `u945162271_imperial_pedia` (refresh with the sync script; do not edit content here) |
| Local site | http://localhost:8000 (docker container `imperial_web`, serves this folder) |
| Live code on the server | `/opt/baalvion/app/legacy-imperialpedia-stage` (plain copy, no git) |

## Everyday
- **Edit content (articles, categories):** live admin only. Instant, no deploy.
- **See live content locally:** `./scripts/sync-from-live.sh` (read-only on live; also copies images).
- **Change code (templates, redirects):** edit here, test on localhost:8000, commit, then `./scripts/deploy-to-live.sh`. It backs up, builds, smoke-tests and asks before going live. Rollback tag: `baalvion-legacy-imperialpedia-web:previous`.
- **Start the local site if it is stopped:** `docker start imperial_web` (if missing, see `docker run` in the project memory notes).

## URL rule
One real URL per article: `/category/sub-category/article`. Any other shape 301-redirects to it.

## Do not
- Run `sql/migrations/008_local_changes_to_live.sql` (obsolete, already applied in trimmed form).
- Run `docker compose up` inside this folder (there is no compose file; it picks up the repo-root one).
