/**
 * Adapts the backend storefront product shape (ProductListItem from commerce-service)
 * into the app's rich `Product` type, filling admin-only fields with safe defaults.
 * This lets backend products flow into the existing `Product`-typed UI/store WITHOUT
 * changing the `Product` type or any consumer (storefront or admin).
 */
import type { Product, Collection, Category } from './types';
import type { ProductListItem, BackendCollection, BackendCategory } from './api-client';

export function toProduct(item: ProductListItem): Product {
  return {
    id: item.id,
    name: item.name,
    departmentId: '',
    categoryId: item.categoryId ?? '',
    subcategoryId: '',
    collectionId: item.collectionId ?? '',
    basePrice: item.basePrice ?? 0,
    imageUrl: Array.isArray(item.imageUrl) ? item.imageUrl : [],
    isVip: item.isVip ?? false,
    rating: item.rating ?? 0,
    reviewsCount: item.reviewsCount ?? 0,
    stock: item.stock ?? 0,
    brandId: item.brandId ?? '',
    isGlobal: true,
    regions: [],
    status: item.status === 'draft' ? 'draft' : 'published',
    lastEditedRegion: 'global',
  };
}

export function toProducts(items: ProductListItem[]): Product[] {
  return items.map(toProduct);
}

export function toCollection(c: BackendCollection): Collection {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? '',
    imageUrl: c.imageUrl ?? '',
    brandId: '',
    isGlobal: true,
  };
}

export function toCollections(list: BackendCollection[]): Collection[] {
  return list.map(toCollection);
}

export function toCategory(c: BackendCategory): Category {
  return {
    id: c.id,
    departmentId: c.parentId ?? '',
    name: c.name,
    subcategories: [], // TODO: build subcategory list from parentId children (nav-tree follow-up)
  };
}

export function toCategories(list: BackendCategory[]): Category[] {
  return list.map(toCategory);
}
