# Product Media System (commerce-service)

Image/video/document library attached to a product. Built on the existing
`commerce_product_media` table (`models/commerceProductMedia.js`). Storefront
already reads it (`media` association, ordered by `sortOrder`).

## Storage

`MEDIA_DRIVER` selects the backend:

| Driver | Behaviour |
| --- | --- |
| `local` (default) | Files under `commerce-service/uploads`, served at `/uploads/<key>` (CORS-open, 7-day cache). Zero-config dev fallback. |
| `minio` / `s3` | S3-compatible object storage via `utils/s3Client.js` (dependency-free SigV4). Objects served by the store; public URL from `S3_PUBLIC_URL`. |

Object key layout: `commerce/products/{productId}/{uuid}{ext}` (+ `_thumb.jpg`).

### Env

```
MEDIA_DRIVER=local            # local | minio | s3
MEDIA_MAX_BYTES=26214400      # 25MB
MEDIA_THUMB_SIZE=400          # thumbnail square px
COMMERCE_PUBLIC_URL=http://localhost:3012   # base for local URLs
# minio/s3:
S3_ENDPOINT= S3_PUBLIC_URL= S3_BUCKET=commerce-media S3_ACCESS_KEY= S3_SECRET_KEY= S3_REGION=
```

### Thumbnails

Real resize (400×400 cover JPEG) when `sharp` is installed
(`pnpm --filter commerce-service add sharp`). Without it, the original image is
reused as its own thumbnail (no hard dependency, no native build needed).
Animated GIF and SVG always reuse the original.

## API

All routes are under `/api/v1/commerce/stores/:storeId/products/:productId` and
gated by the **same RBAC** as product editing (`loadStoreRole` +
`requireStoreRole('content_editor')` to mutate). Every operation verifies the
product belongs to `:storeId` before touching media — no cross-store access.

| Method | Path | Role | Body |
| --- | --- | --- | --- |
| `GET` | `/media` | store role | — |
| `POST` | `/media` | content_editor | multipart: `file`, `mediaType?`, `altText?`, `variantId?`, `isFeatured?` |
| `PUT` | `/media/:mediaId` | content_editor | multipart `file` (replace binary in place) |
| `PATCH` | `/media/:mediaId` | content_editor | JSON: `altText?`, `variantId?`, `isFeatured?` |
| `POST` | `/media/:mediaId/feature` | content_editor | — (make this the hero) |
| `POST` | `/media/reorder` | content_editor | JSON: `orderedIds: string[]` |
| `DELETE` | `/media/:mediaId` | content_editor | — |

### Behaviour
- First image uploaded is auto-featured. Setting/clearing featured keeps exactly
  one featured item per product.
- `reorder` rewrites `sortOrder` to the given order; any id not on the product
  is rejected (400).
- Deleting the featured item promotes the next item (by `sortOrder`) to featured.
- Delete/replace remove the superseded objects from storage (best effort).

### Upload example

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@hero.jpg" -F "altText=Front view" -F "isFeatured=true" \
  http://localhost:3012/api/v1/commerce/stores/$STORE/products/$PRODUCT/media
```
