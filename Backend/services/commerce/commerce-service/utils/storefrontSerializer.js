'use strict';

// Maps commerce-service models into the exact shapes the Amarisé storefront renders
// (Frontend/AmariseMaisonAvenue-main/src/lib/types.ts: Product / Category / Department /
// Collection). Relational data (price → default variant, images → media, taxonomy →
// categories, collection membership → join table) comes from proper columns; app-specific
// luxury attributes (isVip, regions, condition, colors, sizes, rating…) live in the
// product's custom_fields jsonb. Read-only — used by the public storefront API only.

const markets = require('../config/markets');

const asObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

const pickDefaultVariant = (variants = []) =>
    (variants.find((v) => v.isDefault) || variants[0] || null);

// A product is sellable in `country` when it is global, region-less, or explicitly tagged.
function isAvailableInCountry(productJson, country) {
    if (!country) return true;
    const cf = asObject(productJson.customFields);
    if (cf.isGlobal) return true;
    const regions = Array.isArray(cf.regions) ? cf.regions : [];
    if (regions.length === 0) return true;
    return regions.includes(country);
}

// Ordered media rows (featured first, then sortOrder) — the source of truth for storefront
// imagery. Each CommerceProductMedia.url is a real https URL produced by productMediaService
// (local /uploads or S3/MinIO public URL); the storefront renders these directly.
const orderedMedia = (p) =>
    (p.media || [])
        .slice()
        .sort((a, b) => (Number(b.isFeatured) - Number(a.isFeatured)) || ((a.sortOrder || 0) - (b.sortOrder || 0)));

const mediaUrls = (p) => orderedMedia(p).map((m) => m.url).filter(Boolean);

// Rich media objects (url + thumbnail + alt) for galleries; same ordering as imageUrl.
const mediaObjects = (p) =>
    orderedMedia(p)
        .filter((m) => m.url)
        .map((m) => ({
            url: m.url,
            thumbnailUrl: m.thumbnailUrl || m.url,
            altText: m.altText || '',
            mediaType: m.mediaType || 'image',
        }));

// Server-side rating aggregate over ALL approved reviews. recomputeAggregate() (reviewService)
// mirrors AVG(rating)/COUNT into custom_fields.rating/reviewsCount, so the serializer can surface
// a GLOBAL average + count without a read join. Exposed as ratingAverage/ratingCount (the canonical
// C4 fields) AND the legacy rating/reviewsCount aliases so existing consumers keep working.
const ratingAverage = (cf) => {
    const n = Number(cf.rating);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
};
const ratingCount = (cf) => {
    const n = Number(cf.reviewsCount);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
};

// opts.country (one of markets.SUPPORTED_MARKETS) → attach converted price + currency + tax.
// opts.baseCurrency defaults to the store's authoring currency (USD).
function serializeProductListItem(p, opts = {}) {
    const cf = asObject(p.customFields);
    const variant = pickDefaultVariant(p.variants);
    const basePrice = cf.basePrice != null ? Number(cf.basePrice) : variant ? Number(variant.price) : 0;
    const safeBase = Number.isFinite(basePrice) ? basePrice : 0;
    const firstCollection = Array.isArray(p.collections) && p.collections[0] ? p.collections[0].slug : '';

    // Per-country price + tax envelope (base + FX); absent when no/unknown country.
    const pricing = opts.country
        ? markets.priceFields(safeBase, opts.country, opts.baseCurrency)
        : {};

    // Department/brand taxonomy from real backend fields: prefer the resolved category's PARENT
    // (root category = department/brand), fall back to the authored custom_fields.departmentId.
    // This is what the storefront brand tabs / department pages key on — a real backend value,
    // never a hardcoded slug.
    const parentCat = asObject(p.category && p.category.parent);
    const departmentId = parentCat.slug
        || cf.departmentId
        || (p.category && p.category.slug)
        || '';
    const department = parentCat.name || cf.department || '';

    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        departmentId,
        department,
        categoryId: cf.categoryId || (p.category && p.category.slug) || '',
        categoryName: (p.category && p.category.name) || '',
        subcategoryId: cf.subcategoryId || '',
        collectionId: cf.collectionId || firstCollection || '',
        basePrice: safeBase,
        // Country-resolved fields (undefined when no country context — client falls back to basePrice).
        price: pricing.price,
        currencyCode: pricing.currencyCode,
        taxType: pricing.taxType,
        taxRate: pricing.taxRate,
        taxInclusive: pricing.taxInclusive,
        imageUrl: mediaUrls(p),
        media: mediaObjects(p),
        isVip: cf.isVip != null ? !!cf.isVip : !!p.isFeatured,
        // Server-computed rating aggregate over ALL approved reviews (C4). Canonical fields +
        // legacy aliases so the PDP header reads a global average, not a page-scoped client mean.
        ratingAverage: ratingAverage(cf),
        ratingCount: ratingCount(cf),
        rating: ratingAverage(cf),
        reviewsCount: ratingCount(cf),
        // Inventory: prefer the first-class column, fall back to legacy custom_fields.stock.
        // inStock honors track_inventory (untracked products are always purchasable).
        stock: Number(p.stockQuantity ?? cf.stock ?? 0),
        inStock: p.trackInventory ? Number(p.stockQuantity ?? cf.stock ?? 0) > 0 : true,
        brandId: cf.brandId || 'amarise-luxe',
        isGlobal: cf.isGlobal != null ? !!cf.isGlobal : true,
        regions: Array.isArray(cf.regions) ? cf.regions : [],
        status: p.status === 'published' ? 'published' : 'draft',
        lastEditedRegion: cf.lastEditedRegion || 'global',
        colors: Array.isArray(cf.colors) ? cf.colors : undefined,
        sizes: Array.isArray(cf.sizes) ? cf.sizes : undefined,
        vendorId: cf.vendorId,
    };
}

function serializeProductDetail(p, opts = {}) {
    const cf = asObject(p.customFields);
    const seo = asObject(p.seoMetadata);
    return {
        ...serializeProductListItem(p, opts),
        description: p.description || '',
        specialNotes: cf.specialNotes,
        // Luxury-resale provenance. Prefer the first-class columns; fall back to the legacy
        // custom_fields keys for rows authored before the condition/authenticity migration.
        condition: p.condition ?? cf.condition,
        conditionGrade: p.conditionGrade ?? cf.conditionGrade,
        // conditionDetails is the storefront's existing prose field — back it with the new
        // condition_notes column, falling back to the legacy custom_fields key.
        conditionDetails: p.conditionNotes ?? cf.conditionDetails ?? cf.conditionNotes,
        authenticityStatus: p.authenticityStatus ?? cf.authenticityStatus,
        authenticityCertificateCode: p.authenticityCertificateCode ?? cf.authenticityCertificateCode,
        isOneOfAKind: p.isOneOfAKind != null ? !!p.isOneOfAKind : !!cf.isOneOfAKind,
        serialNumber: p.serialNumber ?? cf.serialNumber,
        scope: cf.scope || 'global',
        currentVersion: cf.currentVersion || 1,
        conflictStrategy: cf.conflictStrategy,
        targetKeyword: seo.targetKeyword,
        seoTitle: seo.title || cf.seoTitle,
        seoDescription: seo.description || cf.seoDescription,
    };
}

// Department = root category (parent_id null). categories = child slugs.
function serializeDepartments(cats = []) {
    const roots = cats.filter((c) => !c.parentId);
    return roots.map((d) => ({
        id: d.slug,
        name: d.name,
        description: d.description || '',
        imageUrl: d.imageUrl || '',
        categories: cats.filter((c) => c.parentId === d.id).map((c) => c.slug),
    }));
}

// Category = child category. subcategories stored as string[] in seo_metadata.subcategories.
function serializeCategories(cats = []) {
    const byId = new Map(cats.map((c) => [c.id, c]));
    return cats
        .filter((c) => c.parentId)
        .map((c) => ({
            id: c.slug,
            departmentId: (byId.get(c.parentId) || {}).slug || '',
            name: c.name,
            subcategories: Array.isArray(asObject(c.seoMetadata).subcategories)
                ? asObject(c.seoMetadata).subcategories
                : [],
        }));
}

function serializeCollection(c) {
    const seo = asObject(c.seoMetadata);
    return {
        id: c.slug,
        name: c.name,
        description: c.description || '',
        imageUrl: c.imageUrl || '',
        brandId: seo.brandId || 'amarise-luxe',
        isGlobal: seo.isGlobal != null ? !!seo.isGlobal : true,
    };
}

module.exports = {
    serializeProductListItem,
    serializeProductDetail,
    serializeDepartments,
    serializeCategories,
    serializeCollection,
    isAvailableInCountry,
};
