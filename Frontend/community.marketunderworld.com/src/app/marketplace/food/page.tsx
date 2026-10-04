import { redirect } from 'next/navigation';

// This page showed a hard-coded sample list. Real food listings come from the storefront
// (commerce-service) and are browsed under /shop/food.
export default function MarketplaceFoodRedirect() {
  redirect('/shop/food');
}
