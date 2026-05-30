'use strict';

// Maps commerce-service models into the exact shapes the Amarisé storefront renders
// (Frontend/AmariseMaisonAvenue-main/src/lib/types.ts: Product / Category / Department /
// Collection). Relational data (price → default variant, images → media, taxonomy →
// categories, collection membership → join table) comes from proper columns; app-specific
// luxury attributes (isVip, regions, condition, colors, sizes, rating…) live in the
// product's custom_fields jsonb. Read-only — used by the public storefront API only.

const asObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

const pickDefaultVariant = (variants = []) =>
    (variants.find((v) => v.isDefault) || variants[0] || null);

const mediaUrls = (p) =>
    (p.media || [])
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((m) => m.url)
        .filter(Boolean);

function serializeProductListItem(p) {
    const cf = asObject(p.customFields);
    const variant = pickDefaultVariant(p.variants);
    const basePrice = cf.basePrice != null ? Number(cf.basePrice) : variant ? Number(variant.price) : 0;
    const firstCollection = Array.isArray(p.collections) && p.collections[0] ? p.collections[0].slug : '';
    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        departmentId: cf.departmentId || '',
        categoryId: cf.categoryId || (p.category && p.category.slug) || '',
        subcategoryId: cf.subcategoryId || '',
        collectionId: cf.collectionId || firstCollection || '',
        basePrice: Number.isFinite(basePrice) ? basePrice : 0,
        imageUrl: mediaUrls(p),
        isVip: cf.isVip != null ? !!cf.isVip : !!p.isFeatured,
        rating: Number(cf.rating ?? 0),
        reviewsCount: Number(cf.reviewsCount ?? 0),
        stock: Number(cf.stock ?? 0),
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

function serializeProductDetail(p) {
    const cf = asObject(p.customFields);
    const seo = asObject(p.seoMetadata);
    return {
        ...serializeProductListItem(p),
        description: p.description || '',
        specialNotes: cf.specialNotes,
        condition: cf.condition,
        conditionDetails: cf.conditionDetails,
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
};
