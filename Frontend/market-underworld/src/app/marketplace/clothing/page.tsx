import { getStorefrontProducts } from "@/lib/api/commerce"
import { ClothingPageClient } from "./ClothingPageClient"

export default async function ClothingPage() {
  const products = await getStorefrontProducts('clothing');
  return <ClothingPageClient products={products} />;
}
