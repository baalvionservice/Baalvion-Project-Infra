# Moving legacy.imperialpedia.com → imperialpedia.com

The app already follows whatever host it is served on: canonical tags, sitemap, robots.txt,
Open Graph and JSON-LD all use the request host. Nothing in the code or database needs editing
for the move. Only the switch below and the server routing change.

## Before the move (do while on legacy)
1. Search Console: verify `legacy.imperialpedia.com` (URL-prefix) and `imperialpedia.com` (Domain property).
2. Submit `https://legacy.imperialpedia.com/sitemap.xml`. Request indexing for the 10 strongest pages by hand.
3. Keep the same URL paths on both hosts (they are identical, the app builds them from the request host).
4. Decide what happens to the current Next.js site on `imperialpedia.com`. Two sites cannot share the apex;
   the route swap in step 3 below replaces it.

## Move day
1. Lower the DNS TTL for `imperialpedia.com` to 300 s a day ahead.
2. In `/opt/baalvion/stack/docker-compose.app.yml`, service `app-legacy-imperialpedia-web`, add
   `CANONICAL_HOST: imperialpedia.com` under `environment:`. From then on every request arriving on any
   other real hostname (including legacy) is answered with a **301 to the same path on imperialpedia.com**.
3. In the Caddyfile on the box, point the `imperialpedia.com` (and `www.`) site block at
   `app-legacy-imperialpedia-web:80`, keep `legacy.imperialpedia.com` pointing at it too so the 301s are served.
   Reload Caddy.
4. `docker compose ... up -d --no-build --no-deps app-legacy-imperialpedia-web`.
5. Check: `curl -sI https://legacy.imperialpedia.com/insurance/india` → `301` to `https://imperialpedia.com/insurance/india`;
   `curl -s https://imperialpedia.com/robots.txt` names `https://imperialpedia.com/sitemap.xml`.
6. Cloudflare: purge the cache for both hosts.

## After the move
- Search Console: submit `https://imperialpedia.com/sitemap.xml`. Keep the legacy property; the 301s pass the signals.
  (The Change of Address tool is for domain-to-domain moves, not needed for a subdomain.)
- `ads.txt` is served from the site root and is the same file (`pub-8170643011469769`); confirm `https://imperialpedia.com/ads.txt` loads.
- Leave the 301s in place for at least 12 months.
- Mail: the app sends from `support@imperialpedia.com` already.

## Rollback
Remove `CANONICAL_HOST` from the compose file and restart the container; restore the previous Caddy block.
