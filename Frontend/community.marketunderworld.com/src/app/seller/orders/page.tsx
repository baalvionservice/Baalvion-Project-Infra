import { redirect } from "next/navigation"

// Seller fulfilment now lives on /seller/sales, which only shows orders containing the seller's own products.
export default function SellerOrdersPage() {
  redirect("/seller/sales")
}
