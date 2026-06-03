# Baalvion Media & Product-Image System — Production Readiness Audit

Date: 2026-06-03
Scope: commerce-service, cms-service, Frontend/AmariseMaisonAvenue-main (storefront), Frontend/admin-platform
Method: read-only DB queries + source inspection (file:line). No code changed.

---

## Executive Summary

The **upload plumbing is real and production-grade** in code: both commerce-service
and cms-service have working multipart upload handlers, a dependency-free S3/MinIO
SigV4 client, store/org boundary enforcement, RBAC, thumbnail generation, and clean
delete/replace lifecycle. Both admin upload UIs are wired to the real endpoints.

The **gap is content + configuration, not code**:

1. **Zero real product images.** All 40 `commerce_product_media` rows (20 products ×
   2 images) point at `https://picsum.photos/seed/...` — a random stock-image service.
   0 images live in object storage; 0 in local uploads. Categories and collections
   have **no image at all** (0/19 categories, 0/9 collections).
2. **commerce-service is on the `local` filesystem driver, not MinIO.** `cms-service`
   *is* on MinIO (bucket `cms-media` exists, public-read). The `commerce-media` bucket
   does not exist and the commerce store has never persisted an object.
3. **No CDN and no `sharp`.** There is no CloudFront/CDN layer. The storefront uses
   `next/image` but `sharp` is not installed (degraded JPEG optimization at runtime),
   and `next.config.ts` does not request AVIF/WebP `formats`.
4. **MinIO public-read is only granted per-bucket manually.** If commerce flips to
   MinIO, product media uses non-presigned `publicUrl()` — anonymous browser GETs would
   **403** until the bucket is explicitly set public-read (the init script only does
   `baalvion/public`).

The storefront degrades gracefully: a `BrandImage` primitive detects placeholder
hosts (`picsum`, `placehold.co`, etc.) and renders an elegant branded monogram panel
instead of a stock photo, and real uploads "drop straight in" with no code change.
So the site does not show broken images today — it shows branded placeholders for 100%
of the catalog.

**Verdict: NOT production-ready for launch content.** The machinery works; the catalog
has no real photography and the hosting is in dev mode (filesystem, no CDN, no image
optimization). Remediation is operational (upload real assets, flip driver, add CDN +
sharp), not a rebuild.

---

## Findings

### A. Upload flow — REAL (not stubbed)

**commerce-service** (`service/productMediaService.js`):
- `uploadMedia()` (L118) validates the file (`validateFile` L80: size cap, MIME allowlist),
  builds a key `commerce/products/{productId}/{uuid}{ext}` (L91), calls `putObject()` (L48),
  generates a thumbnail (L128), and writes a `commerce_product_media` row in a transaction.
- `putObject()` (L48): `MEDIA_DRIVER=minio|s3` → `s3.ensureBucket` + `s3.putObject` +
  `s3.publicUrl`; otherwise writes to `commerce-service/uploads/{key}` and returns
  `${COMMERCE_PUBLIC_URL}/uploads/{key}`.
- Lifecycle is complete: `replaceMedia` (L207), `deleteMedia` (L237, promotes next to
  featured), `reorderMedia` (L187), `setFeatured` (L172) — all store-scoped via
  `assertProductInStore` (L39).
- Controller `controller/productMediaController.js` parses multipart via
  `utils/multipart.js` (hand-rolled, no `multer` dep). Routes documented in
  `docs/PRODUCT_MEDIA.md`.

**cms-service** (`service/mediaService.js`):
- `saveUpload()` (L43): `MEDIA_DRIVER=minio` → MinIO; else local. Inserts into
  `cms.cms_media_assets`. `signedUrl()` (L118) returns a real presigned GET on MinIO.
  Org-scoped throughout.

**Storage client** (`utils/s3Client.js`, identical in both services): dependency-free
AWS SigV4 over Node `http`/`crypto`. `ensureBucket`, `putObject`, `deleteObject`,
`presignedGetUrl`, `publicUrl`. Path-style, region us-east-1. This is real, working code.

**Admin upload UIs (real, wired):**
- `Frontend/admin-platform/src/lib/api/product-media.ts` → POST multipart to
  `/commerce/stores/{storeId}/products/{productId}/media` (with progress).
- `Frontend/admin-platform/src/lib/api/media.ts` → POST to `/cms/media/upload`.
- Components: `components/commerce/ProductMediaTab.tsx`, `app/(dashboard)/media/page.tsx`,
  `app/(dashboard)/cms/websites/[websiteId]/media/page.tsx`.

### B. Missing assets

| Asset class | Total | With real image | Placeholder | None |
|---|---|---|---|---|
| Product media rows | 40 | **0** | 40 (100% picsum) | 0 |
| Products (any media) | 20 | 0 real | 20 (picsum) | 0 |
| Categories (`image_url`) | 19 | 0 | 0 | **19 (NULL/empty)** |
| Collections (`image_url`) | 9 | 0 | 0 | **9 (NULL/empty)** |
| Objects in MinIO `commerce-media` | — | bucket does not exist | — | — |
| Files in commerce `uploads/` | 0 | — | — | — |

- Every product has exactly 2 picsum images, one featured (`is_featured=t`). The
  taxonomy is sound: products link to 14 leaf categories via `category_id`; the 5
  "empty" categories (Chanel, Goyard, Hermès, Jewelry, Other Brands) are **department
  roots** (`parent_id IS NULL`) — products hang off their children, so this is expected,
  not a missing-product bug.
- **No orphaned/dangling product references found.** No category with products pointing
  to a missing parent.
- Category and collection hero images are entirely absent — storefront department /
  category / collection headers will fall back (serializer returns `imageUrl: ''`,
  `storefrontSerializer.js` L104, L120, L131).

### C. Broken / placeholder assets

- **100% of catalog imagery is placeholder** (`picsum.photos`). DB classification:
  `picsum: 40`, everything else `0`.
- `thumbnail_url` is **empty on all 40 rows** — these were seeded directly into the DB,
  bypassing the upload pipeline that would have generated thumbnails.
- Frontend placeholder usage (66 occurrences / 20 files), all `picsum.photos` seeds:
  - `src/lib/mock-data.ts` (hero images, craft, certs), `src/lib/mock-category-data.ts`,
    `src/lib/mock-monetization.ts`, `src/app/lib/placeholder-images.json` (17),
    `src/app/[country]/page.tsx` (11), and others.
  - These are dev fallbacks; the live storefront fetches from commerce-service
    (`src/lib/catalog.ts` L37, `revalidate:60`) and falls back to an **empty page**
    (not mock data) on error — so production does not silently serve mock content.
- **No broken `<img>` today**: `components/ui/BrandImage.tsx` `isRealImage()` (L17)
  treats `picsum.photos`/`placehold.co`/`placekitten`/`via.placeholder` as NOT-real and
  renders the branded monogram panel. `ProductCard`, `ProductGallery` → `ImageZoom`
  (L46) and `VerticalGallery` all route through `BrandImage`. Result: branded
  placeholders, never 404 image icons.

### D. Optimization opportunities

- **`next/image` is used** (BrandImage, ImageZoom) with `fill`, `sizes`, and `priority`
  on the hero — responsive + lazy by default. Good.
- **`sharp` is NOT installed** in the Amarise storefront (`package.json`, Next 15.5.18).
  Without sharp, Next's image optimizer falls back to a slower/weaker path; for
  `output: 'standalone'` Docker images sharp must be bundled or images degrade.
- **No `images.formats`** in `next.config.ts` → no automatic AVIF/WebP negotiation.
  Add `formats: ['image/avif','image/webp']`.
- **commerce-service `sharp` is also absent** (`utils/imageThumb.js` L17 optional
  require) → uploaded product images reuse the **original full-size file as their
  thumbnail** (no resize). Grids would download full-resolution images.
- **No CDN.** URLs point at origin: local → `http://localhost:3012/uploads/...`;
  MinIO → `http://localhost:9000/...`. No CloudFront, no cache headers beyond the
  static `/uploads` 7-day `maxAge` (`commerce-service/index.js` L23). No long-lived
  immutable caching, no edge.
- **`remotePatterns` allow-lists placeholder hosts in production** (`next.config.ts`
  L16-19: placehold.co, images.unsplash.com, picsum.photos + madisonavenuecouture.com).
  A real production host is added only if `NEXT_PUBLIC_MEDIA_HOST` is set (L20). The
  placeholder hosts should be removed before launch.

### E. Caching, responsive, fallback (storefront)

| Concern | Status | Evidence |
|---|---|---|
| `next/image` responsive `sizes` | Yes | ProductCard L37, ImageZoom L75, VerticalGallery L129 |
| Lazy-loading | Yes (default) | hero uses `priority` (ImageZoom L74) |
| Explicit width/height | Via `fill` + aspect containers | BrandImage L52, ProductCard `aspect-square` |
| Missing-image fallback | Yes (branded panel) | BrandImage `isRealImage` L17/L47 |
| `width`/`height` to prevent CLS | Partial — uses `fill` in fixed-aspect wrappers (OK) | — |

### F. next.config image hosts

- Amarise `next.config.ts`: `remotePatterns` + matching `img-src` CSP (L56). Production
  media host is env-gated (`NEXT_PUBLIC_MEDIA_HOST`). **Not yet set** to a real CDN/S3.
- admin-platform: no `next/image` remote product hosts configured for the live media
  host (admin renders media via its API responses; verify when commerce media goes
  to a real host).

---

## Catalog Image Coverage (from Postgres `commerce` schema)

```
total_products            : 20   (all published)
products_with_any_media   : 20
total_media_rows          : 40   (image_media_rows: 40)
real_images               : 0
placeholder (picsum)      : 40   (100%)
empty / data-uri / CDN    : 0
thumbnails generated      : 0    (thumbnail_url empty on all rows)
categories                : 19   (with image: 0)
collections               : 9    (with image: 0)
stores                    : 1
MinIO objects (commerce)  : 0    (bucket commerce-media does not exist)
MinIO objects (cms-media) : bucket exists, public-read; CMS uploads functional
```

Per-product: every product = 2 picsum images, 1 featured. No product has a real photo.

---

## Image-Hosting Architecture — Current vs Recommended

### Current (dev posture)

```
Admin upload (real) ──► commerce-service putObject()
                          └─ MEDIA_DRIVER=local (default)  ──► ./uploads/*  served at
                             /uploads (origin :3012, 7-day cache, NO CDN)
                          └─ (minio path exists but UNUSED; bucket absent; non-presigned
                             publicUrl would 403 anonymously until bucket set public)

cms-service ──► MEDIA_DRIVER=minio ──► MinIO bucket cms-media (public-read) ✓ functional

Storefront (Next 15) ──► next/image (NO sharp, NO AVIF/WebP formats)
                          └─ BrandImage placeholder fallback (picsum → branded panel)
Catalog DB ──► 100% picsum.photos URLs (no real photography)
```

### Recommended (production)

```
Admin upload ──► commerce-service putObject()  [MEDIA_DRIVER=s3]
                  └─ sharp installed → real 400px thumbnail + (ideally) AVIF/WebP derivatives
                  └─ AWS S3 bucket (private)  ──► objects keyed commerce/products/{id}/{uuid}
                       │
                       └─► CloudFront distribution (OAC, long-lived immutable cache,
                            HTTP/2/3, AVIF/WebP via Lambda@Edge or pre-generated)
                            origin = S3 (private); public reads via CDN only
                  └─ S3_PUBLIC_URL = https://cdn.amarisemaisonavenue.com  (so publicUrl()
                     emits CDN URLs; OR switch product media to presignedGetUrl for private)

Storefront (Next 15) ──► next/image  [sharp installed]
                          images.formats = ['image/avif','image/webp']
                          remotePatterns = ONLY the real CDN host (drop picsum/unsplash/placehold)
                          NEXT_PUBLIC_MEDIA_HOST = cdn.amarisemaisonavenue.com
Catalog DB ──► real product photography uploaded via admin (replaces picsum rows)
```

Decision point: product photos for a luxury resale storefront are typically **public**
(SEO, social previews) → use **public-read S3 behind CloudFront** with `publicUrl()`.
If watermark/gating is required, use `presignedGetUrl` (cms-service already does this for
`signed-url`). Do not expose MinIO/S3 origin directly to browsers in production.

---

## Prioritized Remediation

### P0 — Launch blockers (content + correctness)
1. **Upload real product photography.** Replace all 40 picsum rows with real images via
   the admin Product Media tab (already functional). Until then the entire catalog shows
   branded placeholders.
2. **Flip commerce-service to object storage** (`MEDIA_DRIVER=s3`, set `S3_*`), and
   **ensure the bucket is readable by browsers**: either set the bucket/prefix public-read
   (MinIO `mc anonymous set download`, or S3 bucket policy / CloudFront OAC) **or** switch
   product media to `presignedGetUrl`. As-is, a naive MinIO flip serves 403s because
   `publicUrl()` is unsigned and `commerce-media` is not public.
3. **Add category & collection hero images** (0/19, 0/9 today) — needed for department/
   category/collection landing pages.

### P1 — Production hosting & performance
4. **Stand up S3 + CloudFront** for commerce (and migrate cms-media off raw MinIO origin
   for prod). Set `S3_PUBLIC_URL`/`NEXT_PUBLIC_MEDIA_HOST` to the CDN host.
5. **Install `sharp`** in the Amarise storefront and in commerce-service (real thumbnails +
   proper next/image optimization in the standalone Docker build).
6. **Enable AVIF/WebP**: add `images.formats: ['image/avif','image/webp']` to
   `next.config.ts`; backfill thumbnails for the existing rows (all `thumbnail_url` empty).
7. **Remove placeholder hosts** (picsum/unsplash/placehold.co) from `remotePatterns` and
   `img-src` CSP before launch; keep only the real CDN host.

### P2 — Hardening & hygiene
8. Long-lived immutable `Cache-Control` on media objects (S3 metadata / CloudFront policy);
   versioned keys already support this (UUID per object).
9. Add a data-quality check / migration that flags products whose media is a placeholder
   host (block publish, or surface in admin) so picsum never reaches production again.
10. Verify admin-platform `next.config` allow-lists the real media host for any `next/image`
    rendering of product media in the console.

### P3 — Nice to have
11. Replace remaining frontend mock placeholders (`mock-data.ts`, `placeholder-images.json`)
    once real editorial/lifestyle photography exists, or keep them strictly dev-only.
12. Consider responsive derivatives (multiple sizes) generated on upload for hero/zoom.
13. Image alt-text completeness pass (alt is populated on product media from product name;
    confirm coverage for category/collection imagery once added).
