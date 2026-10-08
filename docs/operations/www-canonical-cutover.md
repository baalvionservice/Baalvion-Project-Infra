# Cutover: make `www` the canonical host (imperialpedia.com, lawelitenetwork.com)

State before cutover: bare domain is canonical, Cloudflare 301s `www` -> bare.
Code on this branch already points both sites at `www`. Nothing here is deployed.

**Order matters.** If Cloudflare redirects bare -> www while an origin still redirects
www -> bare (or canonicals still say bare), both sites loop and go down.

## Steps (per site, in this order)
1. **Cloudflare:** remove the current `www -> bare` rule, or skip to step 4 and let step 4 replace it
   (the script replaces the zone's single-redirect ruleset in one call).
2. **Imperialpedia origin:** set `CANONICAL_HOST=www.imperialpedia.com` in the container env
   (`/opt/baalvion/stack`), then `scripts/deploy-to-live.sh` for the code. Smoke-test with
   `curl -H 'Host: www.imperialpedia.com'`: must return 200, not a redirect.
3. **Law Elite origin:** rebuild the web image with
   `--build-arg NEXT_PUBLIC_APP_URL=https://www.lawelitenetwork.com` and redeploy. The same build
   arg must be set wherever the image is built on the VPS. Smoke-test: 200 on `Host: www.lawelitenetwork.com`.
4. **Cloudflare:** `CANONICAL=www CF_API_TOKEN=... scripts/cloudflare-canonical-host.sh`
5. **Verify:** `curl -sI` every variant (http/https x bare/www) is a single 301 to `https://www.<domain>/`;
   canonical tag, sitemap `<loc>`, `robots.txt` Sitemap line and `ads.txt` all on `www`.
   `ads.txt` must return 200 on `www.<domain>/ads.txt`.

## Google side (manual)
- Search Console: add the `www` property (or use a Domain property, which covers both) and resubmit sitemaps.
- AdSense: Sites -> make sure the entry matches the canonical host.

## Rollback
`CANONICAL=apex ... scripts/cloudflare-canonical-host.sh`, then revert `CANONICAL_HOST` / redeploy previous images
(`:previous` tag for Imperialpedia).

## Not changed (deliberate)
Email addresses stay `@<bare domain>`; mail does not depend on the web host.
`baalvion.com` / `admin.baalvion.com` links to the bare Law Elite domain still work through the redirect.
