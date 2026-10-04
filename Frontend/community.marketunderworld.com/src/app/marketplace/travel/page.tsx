import { redirect } from 'next/navigation';

// This page showed a hard-coded sample list. Real travel listings come from the storefront
// (commerce-service) and are browsed under /shop/travel.
export default function MarketplaceTravelRedirect() {
  redirect('/shop/travel');
}
