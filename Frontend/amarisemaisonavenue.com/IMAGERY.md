# Amarisé — Imagery Guide (where to upload real photos)

The storefront renders every image through **`src/components/ui/BrandImage.tsx`**:

- If the image URL is a **real photo**, it's shown edge-to-edge.
- If it's missing or still a dev placeholder (`picsum.photos` / `placehold.co`), an **elegant cream + Amarisé monogram panel** is shown instead of a random stock photo.

So you can drop in real photography at any time and it appears automatically — no code changes needed.

## 1. Homepage hero, category tiles & editorial sections
Edit **`src/app/lib/placeholder-images.json`** — replace the `imageUrl` for each `id` with your real photo URL. Recommended sizes:

| id | Where it shows | Suggested size |
|----|----------------|----------------|
| `home-hero-banner-main` | Main hero banner | 1600×800 (landscape, bright editorial) |
| `home-grid-spring` / `home-grid-arrivals` / `home-grid-visit` | 3 category tiles | 800×1000 (portrait 4:5) |
| `home-authenticity-banner` | Authenticity panel | 1200×800 |
| `home-mission-banner` | "Our Mission" panel | 1200×800 |
| `home-info-auth` / `home-info-sell` / `home-info-showrooms` | 3 info blocks | 800×800 (square) |
| `mega-*` | Mega-menu images | 1000×600 |

## 2. Product photos
Upload product images via **admin-platform → Commerce → Products** (stored by `commerce-service` product media). The storefront reads `product.imageUrl[]` from the API; the first image is the card/hero shot. For local/dev you can also edit the `img()` URLs in `commerce-service/scripts/seedAmarise.js` and re-seed.

Use clean, consistent product photography (ideally on white/neutral) for a cohesive grid.

## 3. Allow your image host (IMPORTANT)
`next/image` only loads images from hosts listed in **`next.config.ts → images.remotePatterns`**. Currently allowed: `picsum.photos`, `images.unsplash.com`, `placehold.co`, `madisonavenuecouture.com`.
**Add the host where your real photos live** (your S3 bucket / CDN / commerce-service media domain), e.g.:

```ts
{ protocol: 'https', hostname: 'your-bucket.s3.amazonaws.com', pathname: '/**' }
```

Otherwise real images will fail to load. Tell me the host and I'll add it.
