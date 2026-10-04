import { notFound, redirect } from 'next/navigation';
import { getStorefrontProduct } from '@/lib/api/commerce';

type Props = { params: Promise<{ country: string; category: string; id: string }> };

// The old detail page read a hard-coded product list. Real products live under /shop, so
// resolve the id against the storefront and send the visitor to the canonical URL.
export default async function ListingRedirect({ params }: Props) {
  const { country, id } = await params;
  let product;
  try {
    product = await getStorefrontProduct(id, country);
  } catch {
    notFound();
  }
  redirect(`/shop/${product.categoryId}/${product.slug}`);
}
