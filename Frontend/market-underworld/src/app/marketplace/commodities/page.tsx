import { getStorefrontProducts } from "@/lib/api/commerce"
import { CommoditiesPageClient } from "./CommoditiesPageClient"

export default async function CommoditiesPage() {
  const products = await getStorefrontProducts('commodities');
  return <CommoditiesPageClient products={products} />;
}
