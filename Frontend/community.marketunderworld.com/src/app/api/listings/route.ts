import { NextResponse } from 'next/server';
import { getStorefrontProducts } from '@/lib/api/commerce';

// Adapts real commerce-service StorefrontProduct rows to the field names this route's
// callers (src/app/marketplace/[country]/[category]/page.tsx) render via ListingCard.
function toListingShape(p: Awaited<ReturnType<typeof getStorefrontProducts>>[number]) {
  return {
    id: p.id,
    title: p.name,
    seller: p.categoryName,
    price: p.price,
    is_live: false,
    type: 'listing' as const,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const query = searchParams.get('q') ?? undefined;

  const products = await getStorefrontProducts(
    category && category !== 'all' ? category : undefined,
    { country: country && country !== 'all' ? country : undefined, search: query || undefined }
  );

  const listings = products.map(toListingShape);

  return NextResponse.json({
    success: true,
    data: listings,
    meta: {
      total: listings.length,
      page: 1,
      limit: 20
    }
  });
}