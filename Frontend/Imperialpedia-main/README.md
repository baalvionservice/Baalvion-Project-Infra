# Imperialpedia (imperialpedia.com)

PHP 8.2 / CodeIgniter 3 / MariaDB. Articles, sections and authors live in the database; the admin panel at `/imp-admin` edits them.

> **Right folder:** this one, on branch `fix/imperialpedia-php-adsense-readiness`. `Frontend/Imperialpedia-main` on other branches of the monorepo is the retired Next.js app, not this site.
> Shortcut on the maintainer's Mac: `~/Desktop/Imperialpedia-PHP-LIVE`.

## The one rule
**Content is edited only in the live admin. Code is edited here.** Local is a disposable copy of live; never edit content locally.

## Where things live
| What | Where |
|---|---|
| Live site | Hostinger VPS `baalvion-prod`, container `baalvion-app-imperialpedia-php-web-1` (behind Caddy + Cloudflare) |
| Live database | container `baalvion-app-imperialpedia-php-db-1`, database `legacy_imperialpedia` (the only real database) |
| Live uploads | docker volume `baalvion_legacy_imperialpedia_uploads` (survives every deploy) |
| Live code copy | `/opt/baalvion/app/legacy-imperialpedia-stage` (plain copy, not a git checkout) |
| Local site | http://localhost:8000 (`imperial_web`), admin http://localhost:8000/imp-admin |
| Local database | `imperial_db`, database `u945162271_imperial_pedia` |

## Everyday commands
```bash
docker compose up -d                 # start local site + database + phpMyAdmin (http://localhost:8081)
./scripts/sync-from-live.sh          # copy live database + uploaded images to local (read-only on live)
python3 scripts/check-site.py        # crawl every page: status, canonical, one <h1>  (add a URL to test live)
./scripts/deploy-to-live.sh          # code -> live: backup, build, smoke-test, asks y/N before swapping in
```
First start on a fresh machine: `docker compose up -d`, then `./scripts/sync-from-live.sh`.
Rollback: on the server retag `baalvion-legacy-imperialpedia-web:previous` as `:local` and re-run the `docker compose up -d --no-build --no-deps app-imperialpedia-php-web` step shown at the end of the deploy script.

## How the site is built
- **URLs:** an article lives only at `/category/sub-category/article`. Any other shape 301-redirects to it; unknown slugs return 410 (`application/controllers/PostsCtrl.php`).
- **Sections (`/category/sub-category`):** one shared layout, `views/hub_view.php`. `cookies` keeps its own page (`cookies_view.php`) and landing page (`cookies_index_view.php`).
- **Article pages:** `views/<category>_details_view.php`. Shared pieces (related-reading cards, tables, back links, share row) are CSS + JS at the bottom of `views/includes/footer.php`.
- **Homepage:** `views/home_view.php`, fed by `HomeCtrl`.
- **Helpers:** `helpers/common_helper.php` (excerpts, authors, `post_thumb()` WebP thumbnails, `brand_name()`, `render_related_reading()`).
- **Sitemap / robots:** generated from the database (`SitemapCtrl`).
- **Section on/off switches:** table `site_setting` (`cookies_section_enabled`).

## Social embeds
A plain Instagram (`/p/`, `/reel/`) or Facebook (post, photo, video, reel, `fb.watch`) address pasted into an article or sub-category description is shown as an embedded post at display time (`embed_social()` in `common_helper.php`); the stored text is unchanged. Facebook page/profile addresses stay as text.

## Google News / Discover
Articles (posts, and sub-categories that are themselves the article) output `NewsArticle` + `BreadcrumbList` JSON-LD, `og:type=article`, real publish/modified dates, author and a 600x60 publisher logo (`assets/img/publisher-logo.png`); other pages do not. `/news-sitemap.xml` lists news-section articles from the last 2 days (listed in robots.txt). Discover needs a large (1200 px wide) original image on each article: set the cover/banner image in the admin.

## Performance rules (keep Lighthouse mobile at 90+)
- One self-hosted font (Plus Jakarta Sans) in `assets/fonts/`; old font names are aliased to it in the header. No Google Fonts.
- Icons come from a trimmed Font Awesome (`assets/vendor/fa/css/fa-subset.css`). **After using a new `fa-…` icon run `python3 scripts/build-icon-subset.py` (needs `pip install fonttools brotli`) and commit the result.**
- Card images use `post_thumb()` (resized WebP written to `uploads/post/thumbs/`).
- The AdSense script loads after the first scroll/tap (same publisher id) and `google-adsense-account` is in `<head>`.
- Pages must not send `Cache-Control: no-store` (kills the back/forward cache); `index.php` clears PHP's session cache limiter.

## Admin guards (`AdminCtrl.php`)
Every saved article or sub-category description is cleaned: fixed pixel sizes on pasted pictures removed, own-site links made relative, `<h1>` → `<h2>`, empty paragraphs collapsed. Posts need a sub-category that belongs to the chosen category, a cover image before publishing, and get a hyphenated slug. Covers are resized to ≤1200 px / ≤300 KB.

Post forms have an **Author (Written by)** picker (required to publish), and sub-category forms a writer picker that fills the author name. Sub-category forms (`/imp-admin/add_subcat`, edit) also hold the **meta title, meta description** (with character counters and a live Google-style preview) and **tags**; the meta is stored in table `meta` under `category/sub-category` and follows the sub-category if it is renamed or moved.

## Database changes
`sql/migrations/NNN_*.sql` are numbered, written to be safe to run twice, and applied to **live by hand** (phpMyAdmin or `mysql < file`) after a backup. Numbering has a gap at 008 (a draft that was replaced by 009–012). 001–004 are the original schema/content syncs; 005–012 are the October 2026 cleanup. Old one-off content scripts and database dumps were deleted; they remain in git history.

## Repository map
```
application/    controllers, models, views, helpers, config (CodeIgniter)
assets/         css, js, fonts, img (imperialpedia-logo.svg is the header logo), vendor (bootstrap, jquery, fa)
scripts/        sync-from-live, deploy-to-live, check-site, build-icon-subset
sql/migrations/ numbered database changes
docker/         local database bootstrap
system/         CodeIgniter core (do not edit); license.txt is its licence
uploads/        images (gitignored; synced from live)
```

## Do not
- Run `docker compose up` from the monorepo root (it starts the whole platform).
- Put secrets in git. Database and encryption keys come from container environment variables on the server.
- Edit content in the local database; it is overwritten by the next sync.
