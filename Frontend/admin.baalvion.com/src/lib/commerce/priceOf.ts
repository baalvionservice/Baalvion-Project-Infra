import type { Product } from '@/lib/types/commerce.types';

/** The price customers see: the product's own price field, else its main variant's price. */
export function priceOf(product: Pick<Product, 'customFields' | 'variants'>): number | null {
  const cf = product.customFields?.basePrice;
  if (cf != null && cf !== '' && Number.isFinite(Number(cf))) return Number(cf);
  const v = product.variants?.find((x) => x.isDefault) ?? product.variants?.[0];
  return v && Number.isFinite(Number(v.price)) ? Number(v.price) : null;
}
